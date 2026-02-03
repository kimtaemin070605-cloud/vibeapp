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
		{ id: "1", content: "아침 물 한 잔 마시기", completed: false },
		{ id: "2", content: "30분 스트레칭", completed: true },
		{ id: "3", content: "독서 10페이지", completed: false },
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

	/**
	 * 루틴 추가 (Create)
	 */
	const handleAddRoutine = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim()) {
			alert("루틴을 입력하세요.");
			return;
		}

		const newRoutine: Routine = {
			id: crypto.randomUUID(),
			content: inputValue.trim(),
			completed: false,
		};

		setRoutines((prev) => [...prev, newRoutine]);
		setInputValue("");

		// 추가 후 스크롤 하단 이동 (부드럽게)
		setTimeout(() => {
			listEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 100);
	};

	/**
	 * 루틴 삭제 (Delete)
	 */
	const handleDeleteRoutine = (id: string) => {
		if (window.confirm("정말 삭제하겠습니까?")) {
			setRoutines((prev) => prev.filter((r) => r.id !== id));
		}
	};

	/**
	 * 수정 모드 진입
	 */
	const startEditing = (routine: Routine) => {
		setEditingId(routine.id);
		setEditValue(routine.content);
	};

	/**
	 * 루틴 수정 완료 (Update)
	 */
	const handleUpdateRoutine = (id: string) => {
		const target = routines.find((r) => r.id === id);
		if (!target) return;

		// 사용자가 내용을 수정하지 않았거나 빈칸인 경우 이전 상태 유지
		if (!editValue.trim() || editValue.trim() === target.content) {
			setEditingId(null);
			return;
		}

		setRoutines((prev) =>
			prev.map((r) => (r.id === id ? { ...r, content: editValue.trim() } : r))
		);
		setEditingId(null);
	};

	/**
	 * 완료 상태 토글
	 */
	const toggleComplete = (id: string) => {
		setRoutines((prev) =>
			prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
		);
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4 text-[#333] font-sans selection:bg-black selection:text-white">
			<div className="w-full max-w-[480px] overflow-hidden rounded-[2.5rem] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all">
				{/* Header Section */}
				<header className="px-8 pt-10 pb-6">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2 text-zinc-400">
							<Calendar size={18} />
							<span className="text-sm font-medium tracking-tight">
								{now.toLocaleDateString("ko-KR", {
									year: "numeric",
									month: "long",
									day: "numeric",
									weekday: "short",
								})}
							</span>
						</div>
					</div>
					<h1 className="text-3xl font-bold tracking-tighter text-black">
						My Daily Habits
					</h1>
					<p className="mt-1 text-sm text-zinc-400">오늘 할 일을 체크해보세요.</p>
				</header>

				{/* Input Section */}
				<div className="px-8 mb-4">
					<form
						onSubmit={handleAddRoutine}
						className="relative flex items-center group"
					>
						<input
							type="text"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							placeholder="새로운 루틴을 추가하세요..."
							className="w-full rounded-2xl bg-zinc-100 py-4 pl-5 pr-14 text-sm font-medium transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
						/>
						<button
							type="submit"
							className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-lg transition-transform active:scale-95 group-focus-within:bg-black/80"
						>
							<Plus size={20} strokeWidth={2.5} />
						</button>
					</form>
				</div>

				{/* List Section (Scrollable) */}
				<div className="px-8 pb-10">
					<div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
						{routines.length === 0 ? (
							<div className="py-12 text-center">
								<p className="text-sm text-zinc-400 italic">루틴이 비어있습니다.</p>
							</div>
						) : (
							routines.map((routine) => (
								<div
									key={routine.id}
									className={cn(
										"group flex items-center gap-4 rounded-2xl p-4 transition-all duration-300",
										routine.completed ? "bg-zinc-50 opacity-60" : "bg-white border border-zinc-100 shadow-sm hover:border-zinc-200"
									)}
								>
									{/* Checkbox */}
									<button
										onClick={() => toggleComplete(routine.id)}
										className={cn(
											"flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all",
											routine.completed
												? "border-black bg-black text-white"
												: "border-zinc-200 bg-white hover:border-zinc-300"
										)}
									>
										{routine.completed && <Check size={14} strokeWidth={3} />}
									</button>

									{/* Content */}
									<div className="flex-1 min-w-0">
										{editingId === routine.id ? (
											<div className="flex items-center gap-2">
												<input
													autoFocus
													type="text"
													value={editValue}
													onChange={(e) => setEditValue(e.target.value)}
													onKeyDown={(e) => e.key === "Enter" && handleUpdateRoutine(routine.id)}
													className="w-full bg-transparent text-sm font-semibold text-black focus:outline-none"
												/>
												<div className="flex gap-1">
													<button
														onClick={() => handleUpdateRoutine(routine.id)}
														className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
													>
														<Check size={16} />
													</button>
													<button
														onClick={() => setEditingId(null)}
														className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
													>
														<X size={16} />
													</button>
												</div>
											</div>
										) : (
											<span
												className={cn(
													"block truncate text-sm font-semibold transition-all",
													routine.completed ? "text-zinc-400 line-through" : "text-black"
												)}
											>
												{routine.content}
											</span>
										)}
									</div>

									{/* Actions */}
									{editingId !== routine.id && (
										<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
											<button
												onClick={() => startEditing(routine)}
												className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-black transition-all"
											>
												<Pencil size={16} />
											</button>
											<button
												onClick={() => handleDeleteRoutine(routine.id)}
												className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-all"
											>
												<Trash2 size={16} />
											</button>
										</div>
									)}
								</div>
							))
						)}
						<div ref={listEndRef} />
					</div>
				</div>
			</div>

			<style jsx global>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 4px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #e4e4e7;
					border-radius: 10px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #d4d4d8;
				}
			`}</style>
		</div>
	);
}
