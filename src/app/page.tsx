"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Plus, Trash2, Check, Sparkles, Trophy,
	Palette, Zap, BarChart3, ListChecks, User,
	Calendar, ZapOff, X, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

/**
 * 루틴 데이터 인터페이스
 */
interface Routine {
	id: string;
	content: string;
	is_completed: boolean;
	category: "water" | "health" | "mind" | "habit";
	day_of_week: number;
}

type ThemeType = "ocean" | "sunset" | "forest";
type TabType = "home" | "stats" | "list" | "profile";

export default function HabitTracker() {
	const [theme, setTheme] = useState<ThemeType>("ocean");
	const [activeTab, setActiveTab] = useState<TabType>("home");
	const [mounted, setMounted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [popParticles, setPopParticles] = useState<{ id: number; x: number; y: number }[]>([]);
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);
	const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
	const [inputValue, setInputValue] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [routines, setRoutines] = useState<Routine[]>([]);

	// --- Supabase Data Sync ---

	// 1. 초기 데이터 로드 (테마 및 루틴)
	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			// 테마 로드
			const { data: profile } = await supabase.from("user_profiles").select("current_theme").single();
			if (profile) setTheme(profile.current_theme as ThemeType);

			// 전체 루틴 로드
			const { data: routinesData } = await supabase.from("routines").select("*").order("created_at", { ascending: true });
			if (routinesData) setRoutines(routinesData as Routine[]);
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		setMounted(true);
		fetchData();
	}, [fetchData]);

	const WEEK_DAYS = [
		{ id: 1, label: "월" },
		{ id: 2, label: "화" },
		{ id: 3, label: "수" },
		{ id: 4, label: "목" },
		{ id: 5, label: "금" },
		{ id: 6, label: "토" },
		{ id: 0, label: "일" },
	];

	// 요일별 루틴 필터링 헬퍼
	const getRoutinesByDay = (dayId: number) => routines.filter(r => r.day_of_week === dayId);

	// --- Handlers ---

	const handleAddRoutine = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim()) return;

		const newRoutine = {
			content: inputValue.trim(),
			is_completed: false,
			category: "habit",
			day_of_week: selectedDay
		};

		try {
			const { data, error } = await supabase.from("routines").insert([newRoutine]).select().single();
			if (data) setRoutines(prev => [...prev, data as Routine]);
			if (error) throw error;
			setInputValue("");
		} catch (error) {
			console.error("Add error:", error);
		}
	};

	const toggleComplete = async (id: string, e: React.MouseEvent) => {
		const routine = routines.find(r => r.id === id);
		if (!routine) return;

		if (!routine.is_completed) triggerPop(e);

		try {
			const { error } = await supabase
				.from("routines")
				.update({ is_completed: !routine.is_completed })
				.eq("id", id);

			if (!error) {
				setRoutines(prev => prev.map(r => r.id === id ? { ...r, is_completed: !r.is_completed } : r));
			}
		} catch (error) {
			console.error("Toggle error:", error);
		}
	};

	const deleteRoutine = async (id: string) => {
		try {
			const { error } = await supabase.from("routines").delete().eq("id", id);
			if (!error) {
				setRoutines(prev => prev.filter(r => r.id !== id));
			}
		} catch (error) {
			console.error("Delete error:", error);
		}
	};

	const updateRoutine = async (id: string) => {
		if (!editValue.trim()) { setEditingId(null); return; }
		try {
			const { error } = await supabase.from("routines").update({ content: editValue.trim() }).eq("id", id);
			if (!error) {
				setRoutines(prev => prev.map(r => r.id === id ? { ...r, content: editValue.trim() } : r));
			}
			setEditingId(null);
		} catch (error) {
			console.error("Update error:", error);
		}
	};

	const changeTheme = async (newTheme: ThemeType) => {
		setTheme(newTheme);
		try {
			// 첫 번째 프로필 업데이트 (ID를 모르므로 첫 번째 행 기준)
			const { data: profiles } = await supabase.from("user_profiles").select("id").limit(1);
			if (profiles && profiles.length > 0) {
				await supabase.from("user_profiles").update({ current_theme: newTheme }).eq("id", profiles[0].id);
			}
			window.scrollTo({ top: 0, behavior: "smooth" });
		} catch (error) {
			console.error("Theme sync error:", error);
		}
	};

	const triggerPop = (e: React.MouseEvent) => {
		const newPop = { id: Date.now(), x: e.clientX, y: e.clientY };
		setPopParticles(prev => [...prev.slice(-10), newPop]);
		setTimeout(() => {
			setPopParticles(prev => prev.filter(p => p.id !== newPop.id));
		}, 600);
	};

	// --- Helpers ---
	const getDayProgress = (dayId: number) => {
		const rs = getRoutinesByDay(dayId);
		if (rs.length === 0) return 0;
		return Math.round((rs.filter(r => r.is_completed).length / rs.length) * 100);
	};

	const totalProgress = Math.round(WEEK_DAYS.reduce((acc, d) => acc + getDayProgress(d.id), 0) / 7);

	// --- Calendar Logic ---
	const today = new Date();
	const year = today.getFullYear();
	const month = today.getMonth();
	const firstDayOfMonth = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const calendarDays: (number | null)[] = [];
	const emptySlots = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);
	for (let i = 0; i < emptySlots; i++) calendarDays.push(null);
	for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

	if (!mounted) return null;

	// --- Views ---
	const renderCalendarModal = () => (
		<div
			className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl transition-all duration-500"
			onClick={() => setIsCalendarOpen(false)}
		>
			<div
				className="w-full max-w-[420px] bg-card rounded-[3.5rem] p-10 border border-white/20 shadow-[0_50px_100px_rgba(0,0,0,0.9)] relative"
				onClick={(e) => e.stopPropagation()}
			>
				<button onClick={() => setIsCalendarOpen(false)} className="absolute top-8 right-8 h-12 w-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 hover:rotate-90 transition-all border border-white/10">
					<X size={20} />
				</button>
				<h3 className="text-4xl font-black mb-10 tracking-tighter">{year}년 <br /><span className="text-primary italic">{month + 1}월</span> 에디션</h3>
				<div className="grid grid-cols-7 gap-3 mb-6">
					{["월", "화", "수", "목", "금", "토", "일"].map(d => (
						<div key={d} className="text-[11px] font-black uppercase text-center opacity-30 select-none pb-4">{d}</div>
					))}
					{calendarDays.map((date, i) => (
						<div key={i} className={cn("h-11 flex items-center justify-center rounded-2xl text-base font-black transition-all", date === today.getDate() ? "bg-primary text-primary-foreground shadow-[0_0_30px_var(--primary-glow)] scale-110" : (date ? "hover:bg-white/10 cursor-default" : "opacity-0 select-none"))}>
							{date}
						</div>
					))}
				</div>
				<div className="mt-10 pt-10 border-t border-white/10">
					<div className="flex items-center gap-5 bg-primary/10 p-5 rounded-[2rem] border border-primary/20">
						<div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
							<Zap size={24} className="text-primary fill-primary" />
						</div>
						<div>
							<p className="text-xs font-black uppercase opacity-40 mb-1 tracking-widest">Today&apos;s Vibe</p>
							<p className="text-sm font-bold leading-tight">오늘은 <span className="text-primary font-black">{today.getDate()}일</span>입니다. <br />완성도 100%에 도전하세요!</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const renderHome = () => (
		<div className="flex flex-col">
			<header className="px-10 mb-10 pt-4 relative">
				<div className="flex items-end gap-5 mb-4">
					<span className="text-[80px] font-[950] tracking-[-0.08em] leading-[0.8] text-primary drop-shadow-[0_10px_30px_var(--primary-glow)]">
						{getDayProgress(selectedDay)}<span className="text-[32px] align-top mt-4 ml-1 opacity-40">%</span>
					</span>
					<div className="flex flex-col pb-1">
						<span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-2">Efficiency Rating</span>
						<div className="flex gap-1">
							{[1, 2, 3, 4, 5].map(s => (
								<div key={s} className={cn("h-1.5 w-6 rounded-full", s <= (getDayProgress(selectedDay) / 20) ? "bg-primary" : "bg-white/10")} />
							))}
						</div>
					</div>
				</div>
				<h1 className="text-4xl font-black tracking-tight leading-[1.1] mb-8">Master your <br /><span className="text-primary italic underline underline-offset-[12px] decoration-4 decoration-primary/30">{WEEK_DAYS.find(d => d.id === selectedDay)?.label}요일 리추얼</span></h1>
				<div className="relative h-5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-1 shadow-inner">
					<div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-[1.5s] ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_40px_var(--primary-glow)]" style={{ width: `${getDayProgress(selectedDay)}%` }} />
				</div>
			</header>

			<div className="px-10 mb-10">
				<div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
					{WEEK_DAYS.map((day) => (
						<button key={day.id} onClick={() => setSelectedDay(day.id)} className={cn("flex-none w-16 h-20 flex flex-col items-center justify-center rounded-[1.75rem] transition-all duration-700 relative group overflow-hidden", selectedDay === day.id ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/40 -translate-y-2" : "bg-white/5 opacity-40 hover:opacity-100")}>
							<span className="text-[10px] font-black uppercase opacity-60 mb-1">{day.label}</span>
							<span className="text-xl font-black">{day.label}</span>
							{getDayProgress(day.id) === 100 && <div className="absolute top-1 right-1 h-2 w-2 bg-white rounded-full animate-pulse" />}
						</button>
					))}
				</div>
			</div>

			<div className="px-10 mb-10">
				<form onSubmit={handleAddRoutine} className="relative group">
					<div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-transparent blur-xl opacity-0 group-focus-within:opacity-30 transition-all" />
					<input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="새로운 습관 영감을 기록하세요..." className="neon-input relative" />
					<button type="submit" disabled={!inputValue.trim()} className="absolute right-3 top-3 bottom-3 aspect-square primary-button flex items-center justify-center rounded-2xl disabled:opacity-20">
						<Plus size={24} strokeWidth={4} />
					</button>
				</form>
			</div>

			<div className="px-10 pb-[200px]">
				{loading ? (
					<div className="py-24 flex justify-center text-primary"><Loader2 size={40} className="animate-spin" /></div>
				) : (
					<div className="space-y-5">
						{getRoutinesByDay(selectedDay).length === 0 ? (
							<div className="py-24 text-center flex flex-col items-center opacity-30 animate-floating-gentle">
								<ZapOff size={64} className="mb-6 opacity-20" />
								<p className="text-sm font-black uppercase tracking-[0.4em] italic">No Energy Detected</p>
							</div>
						) : (
							getRoutinesByDay(selectedDay).map((routine) => (
								<div key={routine.id} className={cn("group relative flex items-center gap-6 p-7 rounded-[2.75rem] transition-all duration-700 border border-white/5 active:scale-[0.96]", routine.is_completed ? "bg-black/20 opacity-40 saturate-[0.2]" : "bg-white/5 hover:bg-white/10")}>
									<div onClick={(e) => toggleComplete(routine.id, e)} className={cn("shrink-0 h-16 w-16 flex items-center justify-center rounded-[1.75rem] transition-all duration-700 cursor-pointer shadow-2xl relative", routine.is_completed ? "bg-white/10 rotate-[15deg]" : "bg-primary text-primary-foreground animate-floating-gentle")}>
										{routine.is_completed ? <Check size={32} strokeWidth={4} /> : <Trophy size={32} className="animate-float" />}
									</div>
									<div className="flex-1 min-w-0" onDoubleClick={() => { setEditingId(routine.id); setEditValue(routine.content); }}>
										{editingId === routine.id ? (
											<input autoFocus type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => updateRoutine(routine.id)} onKeyDown={(e) => e.key === "Enter" && updateRoutine(routine.id)} className="w-full bg-transparent text-xl font-black text-primary focus:outline-none" />
										) : (
											<div>
												<span className={cn("block text-xl font-black transition-all mb-1 truncate", routine.is_completed ? "line-through opacity-50" : "text-white")}>{routine.content}</span>
												<span className="text-[10px] uppercase font-black tracking-widest opacity-30 select-none">Double click to edit</span>
											</div>
										)}
									</div>
									<button onClick={() => deleteRoutine(routine.id)} className="h-12 w-12 flex items-center justify-center bg-destructive/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all text-destructive hover:bg-destructive hover:text-white"><Trash2 size={20} /></button>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);

	const renderStats = () => (
		<div className="px-10 pt-4 pb-[200px]">
			<div className="mb-12 flex justify-between items-start">
				<h2 className="text-5xl font-[950] tracking-tighter leading-none">Weekly<br /><span className="text-primary italic">Precision</span></h2>
				<div className="flex flex-col items-end">
					<span className="text-3xl font-black text-primary">{totalProgress}%</span>
					<span className="text-[10px] uppercase font-black opacity-30 tracking-widest text-right">Avg. Growth</span>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-5">
				{WEEK_DAYS.map(day => {
					const p = getDayProgress(day.id);
					const radius = 35;
					const circum = 2 * Math.PI * radius;
					return (
						<div key={day.id} className="bg-white/5 p-8 rounded-[2.5rem] flex flex-col items-center border border-white/5 hover:bg-white/10 transition-all">
							<div className="relative h-24 w-24 mb-6">
								<svg className="w-full h-full transform -rotate-90">
									<circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
									<circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circum} strokeDashoffset={circum - (p / 100) * circum} strokeLinecap="round" className="text-primary transition-all duration-[2s]" />
								</svg>
								<div className="absolute inset-0 flex items-center justify-center text-lg font-black">{day.label}</div>
							</div>
							<span className="text-2xl font-black text-primary">{p}%</span>
							<span className="text-[10px] uppercase font-black opacity-20 tracking-widest mt-2">{getRoutinesByDay(day.id).length} Rituals</span>
						</div>
					);
				})}
			</div>
		</div>
	);

	const renderList = () => (
		<div className="px-10 pt-4 pb-[200px]">
			<h2 className="text-5xl font-[950] tracking-tighter leading-none mb-12">Universal<br /><span className="text-primary italic">Database</span></h2>
			<div className="space-y-4">
				{routines.map((r) => (
					<div key={r.id} className="group bg-white/5 p-6 rounded-[2rem] flex items-center gap-5 border border-white/5 hover:bg-white/8 transition-all">
						<div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-2xl font-black text-sm shrink-0">{WEEK_DAYS.find(d => d.id === r.day_of_week)?.label}</div>
						<div className="flex-1 min-w-0"><p className={cn("font-black text-lg", r.is_completed && "opacity-30 line-through")}>{r.content}</p></div>
						<button onClick={(e) => toggleComplete(r.id, e)} className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", r.is_completed ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40" : "bg-white/5 border border-white/10")}><Check size={18} strokeWidth={4} /></button>
					</div>
				))}
			</div>
		</div>
	);

	const renderProfile = () => (
		<div className="px-10 pt-4 pb-[200px]">
			<h2 className="text-5xl font-[950] tracking-tighter leading-none mb-12">Vibe<br /><span className="text-primary italic">Controller</span></h2>
			<div className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5">
				<h4 className="text-xs uppercase font-black tracking-[0.3em] opacity-40 mb-8">Chromatic Essence</h4>
				<div className="space-y-5">
					{[{ id: "ocean", label: "Quantum Blue", color: "bg-[#00d4ff]" }, { id: "sunset", label: "Neon Flare", color: "bg-[#ff4d4d]" }, { id: "forest", label: "Hyper Emerald", color: "bg-[#00ff88]" }].map((t) => (
						<button key={t.id} onClick={() => changeTheme(t.id as ThemeType)} className={cn("w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all duration-500", theme === t.id ? "bg-white/10 border-primary" : "bg-black/20 border-transparent hover:bg-white/5")}>
							<div className="flex items-center gap-5">
								<div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl", t.color)}><Palette size={24} className="text-black" /></div>
								<span className="font-black text-lg">{t.label}</span>
							</div>
							{theme === t.id && <Check size={28} className="text-primary" strokeWidth={4} />}
						</button>
					))}
				</div>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen relative overflow-x-hidden" data-theme={theme}>
			{popParticles.map(p => (
				<div key={p.id} className="fixed z-[2000] pointer-events-none animate-pop" style={{ left: p.x, top: p.y }}><Sparkles className="text-primary" size={32} /></div>
			))}
			{isCalendarOpen && renderCalendarModal()}
			<div className="vibe-container">
				<div className="trendy-card flex flex-col pt-12">
					<div className="px-10 flex items-center justify-between mb-12 shrink-0">
						<div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-3xl shadow-2xl">
							<div className="h-2 w-2 bg-primary rounded-full animate-pulse-intense" />
							<span className="text-[11px] font-black tracking-[0.4em] uppercase opacity-60">System Active</span>
						</div>
						<button onClick={(e) => { e.stopPropagation(); setIsCalendarOpen(true); }} className="bg-black/30 h-16 w-16 flex items-center justify-center rounded-2xl border border-white/10 hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 transition-all shadow-xl group z-[100]"><Calendar size={24} className="group-hover:rotate-12 transition-all" /></button>
					</div>
					<div className="flex-1 flex flex-col">
						{activeTab === "home" && renderHome()}
						{activeTab === "stats" && renderStats()}
						{activeTab === "list" && renderList()}
						{activeTab === "profile" && renderProfile()}
					</div>
					<nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-8 z-[200]">
						<div className="bg-black/80 backdrop-blur-[120px] rounded-[3.5rem] p-3 border border-white/10 flex items-center justify-between shadow-[0_40px_100px_rgba(0,0,0,0.9)]">
							{[
								{ id: "home", icon: Zap, label: "Ritual" },
								{ id: "stats", icon: BarChart3, label: "Matrix" },
								{ id: "list", icon: ListChecks, label: "Archive" },
								{ id: "profile", icon: Palette, label: "Essence" },
							].map((tab) => {
								const Icon = tab.icon;
								const isActive = activeTab === tab.id;
								return (
									<button key={tab.id} onClick={() => { setActiveTab(tab.id as TabType); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={cn("flex-1 flex flex-col items-center gap-2 py-5 rounded-[2.5rem] transition-all duration-700 relative group", isActive ? "bg-primary text-primary-foreground shadow-3xl shadow-primary/50 -translate-y-4 scale-110" : "opacity-20 hover:opacity-100 hover:scale-105")}>
										<Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 4 : 2} className={cn("transition-all duration-700", isActive && "rotate-[-10deg]")} />
										{isActive && <span className="text-[10px] font-black uppercase tracking-[0.2em] absolute -bottom-1 transform translateY(100%)">{tab.label}</span>}
									</button>
								);
							})}
						</div>
					</nav>
				</div>
			</div>
			<style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shrink-0 { flex-shrink: 0; }
        body { overflow-x: hidden; min-height: 100vh; background: var(--background); }
        h1, h2, h3, h4, span, p { font-family: var(--font-pretendard), sans-serif; }
      `}</style>
		</div>
	);
}
