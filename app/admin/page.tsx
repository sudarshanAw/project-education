"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ClassRow = { id: number; name: string };
type SubjectRow = { id: number; name: string; class_id: number };
type ChapterRow = { id: number; name: string; subject_id: number };

export default function AdminPage() {
  const router = useRouter();

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

  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

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
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
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

  const addQuestion = async () => {
    setMsg(null);
    if (selectedChapterId === "") return;
    if (!questionText.trim() || !answerText.trim()) return;

    const { error } = await supabase.from("questions").insert({
      chapter_id: selectedChapterId,
      question: questionText.trim(),
      answer: answerText.trim(),
      difficulty,
    });

    if (error) return setMsg(error.message);

    setQuestionText("");
    setAnswerText("");
    setDifficulty("easy");
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
          <div className="mt-4 bg-white border rounded-lg p-3 text-sm">
            {msg}
          </div>
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

          <div className="mt-3">
            <label className="text-sm font-medium">Answer</label>
            <textarea
              className="mt-1 w-full rounded-lg border p-2"
              rows={4}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
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
