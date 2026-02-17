"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ClassRow = { id: number; name: string };
type SubjectRow = { id: number; name: string; class_id: number };
type ChapterRow = { id: number; name: string; subject_id: number };

type QuestionType = "theory" | "mcq";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");

  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");

  const [newChapterName, setNewChapterName] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState<number | "">("");

  // Question states
  const [questionType, setQuestionType] = useState<QuestionType>("theory");
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

  // MCQ states
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctOption, setCorrectOption] = useState<number>(0);

  const filteredSubjects = useMemo(() => {
    if (selectedClassId === "") return [];
    return subjects.filter((s) => s.class_id === selectedClassId);
  }, [subjects, selectedClassId]);

  const filteredChapters = useMemo(() => {
    if (selectedSubjectId === "") return [];
    return chapters.filter((c) => c.subject_id === selectedSubjectId);
  }, [chapters, selectedSubjectId]);

  const loadAll = async () => {
    setMsg(null);

    const [{ data: cls }, { data: sub }, { data: ch }] = await Promise.all([
      supabase.from("classes").select("id,name").order("id"),
      supabase.from("subjects").select("id,name,class_id").order("id"),
      supabase.from("chapters").select("id,name,subject_id").order("id"),
    ]);

    setClasses((cls as ClassRow[]) ?? []);
    setSubjects((sub as SubjectRow[]) ?? []);
    setChapters((ch as ChapterRow[]) ?? []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.push("/admin/login");
        return;
      }

      // Check admin
      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!adminRow) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await loadAll();
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const addClass = async () => {
    setMsg(null);
    if (!newClassName.trim()) return;

    const { error } = await supabase.from("classes").insert({
      name: newClassName.trim(),
    });

    if (error) return setMsg(error.message);

    setNewClassName("");
    await loadAll();
    setMsg("✅ Class added!");
  };

  const addSubject = async () => {
    setMsg(null);
    if (selectedClassId === "" || !newSubjectName.trim()) return;

    const { error } = await supabase.from("subjects").insert({
      class_id: selectedClassId,
      name: newSubjectName.trim(),
    });

    if (error) return setMsg(error.message);

    setNewSubjectName("");
    await loadAll();
    setMsg("✅ Subject added!");
  };

  const addChapter = async () => {
    setMsg(null);
    if (selectedSubjectId === "" || !newChapterName.trim()) return;

    const { error } = await supabase.from("chapters").insert({
      subject_id: selectedSubjectId,
      name: newChapterName.trim(),
    });

    if (error) return setMsg(error.message);

    setNewChapterName("");
    await loadAll();
    setMsg("✅ Chapter added!");
  };

  const resetQuestionForm = () => {
    setQuestionType("theory");
    setQuestionText("");
    setAnswerText("");
    setExplanation("");
    setDifficulty("easy");

    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setCorrectOption(0);
  };

  const addQuestion = async () => {
    setMsg(null);
    if (selectedChapterId === "") return;

    if (!questionText.trim()) {
      setMsg("Question is required.");
      return;
    }

    // Theory: needs answer
    if (questionType === "theory" && !answerText.trim()) {
      setMsg("Answer is required for theory questions.");
      return;
    }

    // MCQ: needs 4 options
    if (questionType === "mcq") {
      const opts = [optA, optB, optC, optD].map((x) => x.trim());
      if (opts.some((x) => !x)) {
        setMsg("All 4 options are required for MCQ.");
        return;
      }
    }

    const payload: any = {
      chapter_id: selectedChapterId,
      question: questionText.trim(),
      difficulty,
      question_type: questionType,
      explanation: explanation.trim() || null,
    };

    if (questionType === "theory") {
      payload.answer = answerText.trim();
      payload.options = null;
      payload.correct_option = null;
    } else {
      const opts = [optA, optB, optC, optD].map((x) => x.trim());
      payload.options = opts; // jsonb array
      payload.correct_option = correctOption; // 0..3
      // optional: store the correct option text in answer for display/search
      payload.answer = opts[correctOption];
    }

    const { error } = await supabase.from("questions").insert(payload);

    if (error) return setMsg(error.message);

    resetQuestionForm();
    setMsg("✅ Question added!");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-xl shadow p-6 max-w-md w-full">
          <h1 className="text-xl font-bold text-red-600">Access denied</h1>
          <p className="text-gray-600 mt-2">
            Your account is not in the admin list.
          </p>
          <button
            onClick={logout}
            className="mt-4 w-full rounded-lg bg-gray-800 text-white p-2 font-semibold"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={logout}
            className="rounded-lg bg-gray-800 text-white px-4 py-2 font-semibold"
          >
            Logout
          </button>
        </div>

        {msg && (
          <div className="mt-4 bg-white border rounded-lg p-3 text-sm">{msg}</div>
        )}

        {/* Add Class */}
        <section className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">Add Class</h2>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-lg border p-2"
              placeholder="e.g., Class 1"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <button
              onClick={addClass}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold"
            >
              Add
            </button>
          </div>
        </section>

        {/* Add Subject */}
        <section className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">Add Subject</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              className="rounded-lg border p-2"
              value={selectedClassId}
              onChange={(e) =>
                setSelectedClassId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              className="rounded-lg border p-2 sm:col-span-2"
              placeholder="e.g., Mathematics"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
            />
          </div>

          <button
            onClick={addSubject}
            className="mt-3 rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold"
          >
            Add Subject
          </button>
        </section>

        {/* Add Chapter */}
        <section className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">Add Chapter</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              className="rounded-lg border p-2"
              value={selectedClassId}
              onChange={(e) =>
                setSelectedClassId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-lg border p-2"
              value={selectedSubjectId}
              onChange={(e) =>
                setSelectedSubjectId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Select Subject</option>
              {filteredSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <input
              className="rounded-lg border p-2"
              placeholder="e.g., Sets"
              value={newChapterName}
              onChange={(e) => setNewChapterName(e.target.value)}
            />
          </div>

          <button
            onClick={addChapter}
            className="mt-3 rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold"
          >
            Add Chapter
          </button>
        </section>

        {/* Add Question */}
        <section className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">Add Question</h2>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              className="rounded-lg border p-2"
              value={selectedClassId}
              onChange={(e) =>
                setSelectedClassId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-lg border p-2"
              value={selectedSubjectId}
              onChange={(e) =>
                setSelectedSubjectId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Select Subject</option>
              {filteredSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-lg border p-2"
              value={selectedChapterId}
              onChange={(e) =>
                setSelectedChapterId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Select Chapter</option>
              {filteredChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              className="rounded-lg border p-2"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>

            <select
              className="rounded-lg border p-2"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            >
              <option value="theory">Theory (text answer)</option>
              <option value="mcq">MCQ (options)</option>
            </select>
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium">Question</label>
            <textarea
              className="mt-1 w-full rounded-lg border p-2"
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
            />
          </div>

          {/* THEORY */}
          {questionType === "theory" && (
            <div className="mt-3">
              <label className="text-sm font-medium">Answer</label>
              <textarea
                className="mt-1 w-full rounded-lg border p-2"
                rows={4}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
              />
            </div>
          )}

          {/* MCQ */}
          {questionType === "mcq" && (
            <div className="mt-4 rounded-lg border p-4 bg-gray-50">
              <div className="font-semibold text-sm mb-3">MCQ Options</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="rounded-lg border p-2"
                  placeholder="Option A"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                />
                <input
                  className="rounded-lg border p-2"
                  placeholder="Option B"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                />
                <input
                  className="rounded-lg border p-2"
                  placeholder="Option C"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                />
                <input
                  className="rounded-lg border p-2"
                  placeholder="Option D"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                />
              </div>

              <div className="mt-3">
                <label className="text-sm font-medium">Correct Option</label>
                <select
                  className="mt-1 w-full rounded-lg border p-2"
                  value={correctOption}
                  onChange={(e) => setCorrectOption(Number(e.target.value))}
                >
                  <option value={0}>A</option>
                  <option value={1}>B</option>
                  <option value={2}>C</option>
                  <option value={3}>D</option>
                </select>
              </div>
            </div>
          )}

          {/* Explanation (optional) */}
          <div className="mt-3">
            <label className="text-sm font-medium">Explanation (optional)</label>
            <textarea
              className="mt-1 w-full rounded-lg border p-2"
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why the answer is correct…"
            />
          </div>

          <button
            onClick={addQuestion}
            className="mt-3 rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold"
          >
            Add Question
          </button>
        </section>
      </div>
    </main>
  );
}
