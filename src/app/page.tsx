"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 루틴 데이터 인터페이스
 */
interface Routine {
	id: string;
	content: string;
	completed: boolean;
}

/**
 * Vibe Architect가 제안하는 Habit Tracker
 * - CRUD 기능 포함
 * - Tailwind v4 기반 스타일링
 * - Mobile First 디자인
 */
export default function HabitTracker() {
	// --- State ---
	const [routines, setRoutines] = useState<Routine[]>([
		{ id: "1", content: "Meditate", completed: false },
		{ id: "2", content: "Drink Water", completed: true },
		{ id: "3", content: "Read a Book", completed: false },
	]);
	const [inputValue, setInputValue] = useState("");
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
		if (!inputValue.trim()) return;

		const newRoutine: Routine = {
			id: crypto.randomUUID(),
			content: inputValue.trim(),
			completed: false,
		};

		setRoutines((prev) => [...prev, newRoutine]);
		setInputValue("");

		setTimeout(() => {
			listEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 100);
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

	// --- Progress calculation ---
	const completedCount = routines.filter(r => r.completed).length;
	const progressPercent = routines.length > 0 ? Math.round((completedCount / routines.length) * 100) : 0;

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
						My Daily<br />Habits
					</h1>
				</header>

				{/* Progress Stats Card */}
				<div className="bg-white/5 rounded-3xl p-6 flex items-center justify-between border border-white/5">
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium text-white/50">오늘의 진행률</span>
						<span className="text-2xl font-bold text-white">{progressPercent}% 완료</span>
					</div>
					<div className="relative h-16 w-16 flex items-center justify-center">
						<svg className="h-full w-full rotate-[-90deg]">
							<circle
								cx="32"
								cy="32"
								r="28"
								className="stroke-white/10 fill-none"
								strokeWidth="6"
							/>
							<circle
								cx="32"
								cy="32"
								r="28"
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

				{/* Add Section */}
				<form onSubmit={handleAddRoutine} className="relative">
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder="무엇을 습관으로 만들까요?"
						className="w-full rounded-2xl bg-white/5 border border-white/10 py-5 pl-6 pr-16 text-sm font-medium text-white transition-all focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-white/20"
					/>
					<button
						type="submit"
						className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-xl bg-primary text-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
					>
						<Plus size={20} strokeWidth={3} />
					</button>
				</form>

				{/* Habits List */}
				<div className="max-h-[350px] overflow-y-auto pr-3 custom-scrollbar flex flex-col gap-4">
					{routines.length === 0 ? (
						<div className="py-10 text-center flex flex-col items-center gap-3">
							<div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
								<Plus size={24} />
							</div>
							<p className="text-sm text-white/30 font-medium">루틴을 추가하고 시작해보세요.</p>
						</div>
					) : (
						routines.map((routine) => (
							<div
								key={routine.id}
								className={cn(
									"group flex items-center gap-5 rounded-3xl p-5 transition-all duration-500",
									routine.completed
										? "bg-primary/5 border border-primary/10"
										: "bg-white/5 border border-white/5 hover:bg-white/8 hover:border-white/10 hover:translate-x-1"
								)}
							>
								{/* Checkbox / Progress Ring Mini */}
								<button
									onClick={() => toggleComplete(routine.id)}
									className={cn(
										"relative h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl border-2 transition-all duration-300",
										routine.completed
											? "bg-primary border-primary shadow-lg shadow-primary/30"
											: "bg-white/5 border-white/10 hover:border-primary/50"
									)}
								>
									{routine.completed ? (
										<Check size={18} strokeWidth={4} className="text-black" />
									) : (
										<div className="h-2 w-2 rounded-full bg-white/20 transition-all group-hover:bg-primary/50" />
									)}
								</button>

								{/* Content */}
								<div className="flex-1 min-w-0">
									{editingId === routine.id ? (
										<input
											autoFocus
											type="text"
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											onBlur={() => handleUpdateRoutine(routine.id)}
											onKeyDown={(e) => e.key === "Enter" && handleUpdateRoutine(routine.id)}
											className="w-full bg-transparent text-base font-bold text-white focus:outline-none"
										/>
									) : (
										<div className="flex flex-col">
											<span
												onClick={() => toggleComplete(routine.id)}
												className={cn(
													"block truncate text-base font-bold transition-all cursor-pointer",
													routine.completed ? "text-white/40 line-through" : "text-white"
												)}
											>
												{routine.content}
											</span>
											{!routine.completed && (
												<span className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
													In Progress
												</span>
											)}
										</div>
									)}
								</div>

								{/* Actions */}
								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
									<button
										onClick={() => startEditing(routine)}
										className="p-2 text-white/30 hover:text-white transition-colors"
									>
										<Pencil size={14} />
									</button>
									<button
										onClick={() => handleDeleteRoutine(routine.id)}
										className="p-2 text-white/30 hover:text-red-400 transition-colors"
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						))
					)}
					<div ref={listEndRef} />
				</div>
			</div>
		</div>
	);
}
