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
	completedDates: string[]; // "DayID" 형식으로 저장하여 요일별 독립 보관
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
		{ id: "1", content: "Meditate", completedDates: [], days: [1, 3, 5] },
		{ id: "2", content: "Drink Water", completedDates: [], days: [1, 2, 3, 4, 5, 6, 0] },
		{ id: "3", content: "Read a Book", completedDates: [], days: [6, 0] },
	]);
	const [inputValue, setInputValue] = useState("");
	const [selectedDays, setSelectedDays] = useState<number[]>([new Date().getDay()]);
	const [openDay, setOpenDay] = useState<number | null>(new Date().getDay());
	const [now, setNow] = useState(new Date());

	// --- Handlers ---
	const handleAddRoutine = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || selectedDays.length === 0) return;

		const newRoutine: Routine = {
			id: crypto.randomUUID(),
			content: inputValue.trim(),
			completedDates: [],
			days: [...selectedDays],
		};

		setRoutines((prev) => [...prev, newRoutine]);
		setInputValue("");
	};

	const handleDeleteRoutine = (id: string) => {
		setRoutines((prev) => prev.filter((r) => r.id !== id));
	};

	const toggleComplete = (routineId: string, dayId: number) => {
		const dateKey = `${dayId}`;
		setRoutines((prev) =>
			prev.map((r) => {
				if (r.id === routineId) {
					const isDone = r.completedDates.includes(dateKey);
					return {
						...r,
						completedDates: isDone
							? r.completedDates.filter(d => d !== dateKey)
							: [...r.completedDates, dateKey]
					};
				}
				return r;
			})
		);
	};

	const toggleDaySelection = (day: number) => {
		setSelectedDays(prev =>
			prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
		);
	};

	const toggleSelectAll = () => {
		if (selectedDays.length === 7) setSelectedDays([]);
		else setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
	};

	// --- Helpers ---
	const getProgress = (dayId: number) => {
		const dayRoutines = routines.filter(r => r.days.includes(dayId));
		const doneCount = dayRoutines.filter(r => r.completedDates.includes(`${dayId}`)).length;
		return {
			total: dayRoutines.length,
			done: doneCount,
			percent: dayRoutines.length > 0 ? Math.round((doneCount / dayRoutines.length) * 100) : 0
		};
	};

	const todayProgress = getProgress(now.getDay());

	return (
		<div className="flex min-h-screen items-center justify-center p-4 selection:bg-primary selection:text-black">
			<div className="w-full max-w-[440px] glass-card rounded-[3rem] p-8 pb-10 flex flex-col gap-8 transition-all hover:shadow-primary/5">

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
					<h1 className="text-4xl font-extrabold tracking-tight text-white text-glow leading-tight">
						Routine<br /><span className="text-primary italic">Planner</span>
					</h1>
				</header>

				{/* Today's Stats Card */}
				<div className="bg-white/5 rounded-3xl p-6 flex items-center justify-between border border-white/10 group overflow-hidden relative">
					<div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
					<div className="flex flex-col gap-1 relative z-10">
						<span className="text-sm font-medium text-white/50">오늘의 진행 상황</span>
						<span className="text-2xl font-black text-white tracking-tight italic">{todayProgress.done} / {todayProgress.total} Done</span>
					</div>
					<div className="relative h-16 w-16 flex items-center justify-center z-10">
						<svg className="h-full w-full rotate-[-90deg]">
							<circle cx="32" cy="32" r="28" className="stroke-white/10 fill-none" strokeWidth="6" />
							<circle
								cx="32" cy="32" r="28"
								className="stroke-primary fill-none transition-all duration-700 ease-in-out"
								strokeWidth="6"
								strokeDasharray={2 * Math.PI * 28}
								strokeDashoffset={2 * Math.PI * 28 * (1 - todayProgress.percent / 100)}
								strokeLinecap="round"
							/>
						</svg>
						<span className="absolute text-[10px] font-black text-primary">{todayProgress.percent}%</span>
					</div>
				</div>

				{/* Add Section with Improved Selection */}
				<div className="flex flex-col gap-5 bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner">
					<div className="flex items-center justify-between px-1">
						<span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Days Selection</span>
						<button
							onClick={toggleSelectAll}
							className="text-[10px] font-bold text-primary hover:underline"
						>
							{selectedDays.length === 7 ? "Deselect All" : "Select All"}
						</button>
					</div>
					<div className="flex justify-between items-center gap-1.5">
						{WEEK_DAYS.map((day) => (
							<button
								key={day.id}
								onClick={() => toggleDaySelection(day.id)}
								className={cn(
									"flex-1 aspect-square rounded-2xl text-[11px] font-black transition-all border-2",
									selectedDays.includes(day.id)
										? "bg-primary border-primary text-black shadow-lg shadow-primary/30 scale-105"
										: "bg-white/5 border-white/5 text-white/50 hover:border-white/20"
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
							placeholder="무엇을 루틴으로 만들까요?"
							className="w-full rounded-2xl bg-black/20 border border-white/10 py-5 pl-6 pr-16 text-sm font-bold text-white transition-all focus:bg-black/40 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-white/20 shadow-inner"
						/>
						<button
							type="submit"
							disabled={!inputValue.trim() || selectedDays.length === 0}
							className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-xl bg-primary text-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale"
						>
							<Plus size={22} strokeWidth={4} />
						</button>
					</form>
				</div>

				{/* Weekly Accordion List */}
				<div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-3 custom-scrollbar">
					{WEEK_DAYS.map((day) => {
						const dayRoutines = routines.filter(r => r.days.includes(day.id));
						const stats = getProgress(day.id);
						const isOpen = openDay === day.id;

						return (
							<div key={day.id} className="flex flex-col group/accordion">
								{/* Accordion Header */}
								<button
									onClick={() => setOpenDay(isOpen ? null : day.id)}
									className={cn(
										"flex items-center justify-between p-6 rounded-[2rem] transition-all duration-500 border relative overflow-hidden",
										isOpen
											? "bg-white/15 border-white/30 shadow-2xl scale-[1.02] z-10"
											: "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 opacity-70 hover:opacity-100"
									)}
								>
									{isOpen && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
									<div className="flex items-center gap-4">
										<div className={cn(
											"h-10 w-10 flex items-center justify-center rounded-2xl font-black text-xs transition-all duration-500",
											isOpen ? "bg-primary text-black rotate-[360deg] shadow-lg shadow-primary/30" : "bg-white/10 text-white"
										)}>
											{day.label}
										</div>
										<div className="flex flex-col items-start gap-0.5">
											<span className={cn(
												"text-base font-black tracking-tight",
												isOpen ? "text-white" : "text-white/60"
											)}>
												{day.label}요일 루틴
											</span>
											<span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
												{stats.done} / {stats.total} Completed
											</span>
										</div>
									</div>
									<div className="flex items-center gap-3">
										{!isOpen && stats.total > 0 && (
											<div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
												<div
													className="h-full bg-primary transition-all duration-1000"
													style={{ width: `${stats.percent}%` }}
												/>
											</div>
										)}
										<ChevronDown size={20} className={cn(
											"text-white/20 transition-all duration-500",
											isOpen && "rotate-180 text-primary"
										)} />
									</div>
								</button>

								{/* Accordion Content */}
								<div className={cn(
									"grid transition-all duration-500 ease-in-out",
									isOpen ? "grid-rows-[1fr] opacity-100 mt-4 px-2" : "grid-rows-[0fr] opacity-0"
								)}>
									<div className="overflow-hidden flex flex-col gap-3">
										{dayRoutines.length === 0 ? (
											<div className="p-8 text-center bg-white/2 border border-dashed border-white/10 rounded-3xl">
												<p className="text-xs text-white/20 font-bold uppercase tracking-widest">No Routines</p>
											</div>
										) : (
											dayRoutines.map((routine) => {
												const isCompletedToday = routine.completedDates.includes(`${day.id}`);
												return (
													<div
														key={`${day.id}-${routine.id}`}
														className={cn(
															"flex items-center gap-5 rounded-[1.75rem] p-5 transition-all duration-300 border",
															isCompletedToday
																? "bg-primary/10 border-primary/20 shadow-inner"
																: "bg-white/5 border-white/10 hover:bg-white/8"
														)}
													>
														<button
															onClick={() => toggleComplete(routine.id, day.id)}
															className={cn(
																"relative h-11 w-11 shrink-0 flex items-center justify-center rounded-2xl border-2 transition-all duration-500",
																isCompletedToday
																	? "bg-primary border-primary shadow-lg shadow-primary/40 rotate-[360deg]"
																	: "bg-white/5 border-white/10 hover:border-primary/50"
															)}
														>
															{isCompletedToday ? (
																<Check size={20} strokeWidth={5} className="text-black" />
															) : (
																<div className="h-2 w-2 rounded-full bg-white/20" />
															)}
														</button>
														<div className="flex-1 min-w-0" onClick={() => toggleComplete(routine.id, day.id)}>
															<span className={cn(
																"block truncate text-base font-black transition-all cursor-pointer",
																isCompletedToday ? "text-white/30 line-through italic" : "text-white"
															)}>
																{routine.content}
															</span>
														</div>
														<button
															onClick={() => handleDeleteRoutine(routine.id)}
															className="p-2.5 text-white/5 hover:text-red-400 transition-all hover:scale-110"
														>
															<Trash2 size={16} />
														</button>
													</div>
												);
											})
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
