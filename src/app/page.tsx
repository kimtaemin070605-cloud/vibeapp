"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 루틴 데이터 인터페이스
 */
interface Routine {
	id: string;
	content: string;
	completed: boolean;
	days: number[]; // 0: 일, 1: 월, ..., 6: 토
}

const WEEK_DAYS = [
	{ id: 1, label: "월" },
	{ id: 2, label: "화" },
	{ id: 3, label: "수" },
	{ id: 4, label: "목" },
	{ id: 5, label: "금" },
	{ id: 6, label: "토" },
	{ id: 0, label: "일" },
];

export default function HabitTracker() {
	// --- State ---
	const [routines, setRoutines] = useState<Routine[]>([
		{ id: "1", content: "Meditate", completed: false, days: [1, 3, 5] },
		{ id: "2", content: "Drink Water", completed: true, days: [1, 2, 3, 4, 5, 6, 0] },
		{ id: "3", content: "Read a Book", completed: false, days: [6, 0] },
	]);
	const [inputValue, setInputValue] = useState("");
	const [selectedDays, setSelectedDays] = useState<number[]>([new Date().getDay()]);
	const [openDay, setOpenDay] = useState<number | null>(new Date().getDay());
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [now, setNow] = useState(new Date());

	// --- Refs ---
	const listEndRef = useRef<HTMLDivElement>(null);

	// --- Side Effects ---
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 1000 * 60);
		return () => clearInterval(timer);
	}, []);

	// --- Handlers ---
	const handleAddRoutine = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || selectedDays.length === 0) return;

		const newRoutine: Routine = {
			id: crypto.randomUUID(),
			content: inputValue.trim(),
			completed: false,
			days: [...selectedDays],
		};

		setRoutines((prev) => [...prev, newRoutine]);
		setInputValue("");
		// 요일 선택은 현재 요일로 초기화하거나 유지 (여기서는 유지)
	};

	const handleDeleteRoutine = (id: string) => {
		setRoutines((prev) => prev.filter((r) => r.id !== id));
	};

	const startEditing = (routine: Routine) => {
		setEditingId(routine.id);
		setEditValue(routine.content);
	};

	const handleUpdateRoutine = (id: string) => {
		const target = routines.find((r) => r.id === id);
		if (!target) return;
		if (!editValue.trim() || editValue.trim() === target.content) {
			setEditingId(null);
			return;
		}
		setRoutines((prev) =>
			prev.map((r) => (r.id === id ? { ...r, content: editValue.trim() } : r))
		);
		setEditingId(null);
	};

	const toggleComplete = (id: string) => {
		setRoutines((prev) =>
			prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
		);
	};

	const toggleDaySelection = (day: number) => {
		setSelectedDays(prev =>
			prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
		);
	};

	// --- Progress calculation ---
	const today = now.getDay();
	const todaysRoutines = routines.filter(r => r.days.includes(today));
	const completedCount = todaysRoutines.filter(r => r.completed).length;
	const progressPercent = todaysRoutines.length > 0 ? Math.round((completedCount / todaysRoutines.length) * 100) : 0;

	return (
		<div className="flex min-h-screen items-center justify-center p-4 selection:bg-primary selection:text-black">
			<div className="w-full max-w-[420px] glass-card rounded-[3rem] p-8 pb-10 flex flex-col gap-8 transition-all hover:shadow-primary/5">

				{/* Top Info */}
				<header className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-primary/60">
							<Calendar size={14} />
							<span className="text-xs font-semibold tracking-widest uppercase">
								{now.toLocaleDateString("ko-KR", { weekday: "long", month: "long", day: "numeric" })}
							</span>
						</div>
						<div className="h-2 w-2 rounded-full bg-primary neon-glow" />
					</div>
					<h1 className="text-4xl font-extrabold tracking-tight text-white text-glow">
						Weekly<br />Habits
					</h1>
				</header>

				{/* Progress Stats Card */}
				<div className="bg-white/5 rounded-3xl p-6 flex items-center justify-between border border-white/5">
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium text-white/50">오늘의 달성도</span>
						<span className="text-2xl font-bold text-white tracking-tight">{progressPercent}% Completed</span>
					</div>
					<div className="relative h-16 w-16 flex items-center justify-center">
						<svg className="h-full w-full rotate-[-90deg]">
							<circle cx="32" cy="32" r="28" className="stroke-white/10 fill-none" strokeWidth="6" />
							<circle
								cx="32" cy="32" r="28"
								className="stroke-primary fill-none transition-all duration-700 ease-in-out"
								strokeWidth="6"
								strokeDasharray={2 * Math.PI * 28}
								strokeDashoffset={2 * Math.PI * 28 * (1 - progressPercent / 100)}
								strokeLinecap="round"
							/>
						</svg>
						<span className="absolute text-[10px] font-bold text-primary">{progressPercent}%</span>
					</div>
				</div>

				{/* Add Section with Day Selection */}
				<div className="flex flex-col gap-4">
					<div className="flex justify-between items-center gap-1">
						{WEEK_DAYS.map((day) => (
							<button
								key={day.id}
								onClick={() => toggleDaySelection(day.id)}
								className={cn(
									"flex-1 h-10 rounded-xl text-[10px] font-bold transition-all border",
									selectedDays.includes(day.id)
										? "bg-primary border-primary text-black shadow-lg shadow-primary/20"
										: "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
								)}
							>
								{day.label}
							</button>
						))}
					</div>
					<form onSubmit={handleAddRoutine} className="relative">
						<input
							type="text"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							placeholder="새로운 습관을 입력하세요"
							className="w-full rounded-2xl bg-white/5 border border-white/10 py-5 pl-6 pr-16 text-sm font-medium text-white transition-all focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-white/20"
						/>
						<button
							type="submit"
							disabled={!inputValue.trim() || selectedDays.length === 0}
							className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-xl bg-primary text-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
						>
							<Plus size={20} strokeWidth={3} />
						</button>
					</form>
				</div>

				{/* Weekly Accordion List */}
				<div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
					{WEEK_DAYS.map((day) => {
						const dayRoutines = routines.filter(r => r.days.includes(day.id));
						const isOpen = openDay === day.id;

						return (
							<div key={day.id} className="flex flex-col overflow-hidden">
								{/* Accordion Header */}
								<button
									onClick={() => setOpenDay(isOpen ? null : day.id)}
									className={cn(
										"flex items-center justify-between p-5 rounded-3xl transition-all duration-300 border",
										isOpen
											? "bg-white/10 border-white/20 shadow-lg"
											: "bg-white/5 border-white/5 hover:border-white/10"
									)}
								>
									<div className="flex items-center gap-3">
										<div className={cn(
											"h-8 w-8 flex items-center justify-center rounded-xl font-bold text-xs transition-all",
											isOpen ? "bg-primary text-black" : "bg-white/10 text-white"
										)}>
											{day.label}
										</div>
										<span className={cn(
											"text-sm font-bold tracking-tight transition-all",
											isOpen ? "text-white" : "text-white/60"
										)}>
											{day.label}요일 루틴
										</span>
										<span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
											{dayRoutines.length} items
										</span>
									</div>
									<ChevronDown size={18} className={cn(
										"text-white/30 transition-transform duration-300",
										isOpen && "rotate-180 text-primary"
									)} />
								</button>

								{/* Accordion Content (Slide items) */}
								<div className={cn(
									"grid transition-all duration-300 ease-in-out",
									isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
								)}>
									<div className="overflow-hidden flex flex-col gap-2">
										{dayRoutines.length === 0 ? (
											<div className="px-6 py-4 text-[10px] text-white/20 italic">등록된 루틴이 없습니다.</div>
										) : (
											dayRoutines.map((routine) => (
												<div
													key={`${day.id}-${routine.id}`}
													className={cn(
														"flex items-center gap-4 rounded-2xl p-4 transition-all border",
														routine.completed
															? "bg-primary/5 border-primary/10 opacity-60"
															: "bg-white/5 border-white/5"
													)}
												>
													<button
														onClick={() => toggleComplete(routine.id)}
														className={cn(
															"h-8 w-8 shrink-0 flex items-center justify-center rounded-xl border-2 transition-all",
															routine.completed
																? "bg-primary border-primary"
																: "bg-white/5 border-white/10 hover:border-primary/50"
														)}
													>
														{routine.completed && <Check size={14} strokeWidth={4} className="text-black" />}
													</button>
													<div className="flex-1 min-w-0">
														<span className={cn(
															"block truncate text-sm font-bold transition-all",
															routine.completed ? "text-white/30 line-through" : "text-white"
														)}>
															{routine.content}
														</span>
													</div>
													<div className="flex gap-1">
														<button
															onClick={() => handleDeleteRoutine(routine.id)}
															className="p-1.5 text-white/10 hover:text-red-400 transition-colors"
														>
															<Trash2 size={14} />
														</button>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
