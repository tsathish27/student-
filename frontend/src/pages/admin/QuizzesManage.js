import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { EyeIcon, EyeOffIcon, EditIcon, TrashIcon } from './_Icon';

export default function QuizzesManage() {
  const [editQuizId, setEditQuizId] = useState(null);
  const [viewQuiz, setViewQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', subject: '', section: '', year: '', semester: '', deadline: '',
    questions: [{ text: '', options: ['', '', '', ''], correctOption: 0, marks: 1 }]
  });
  const [subjects, setSubjects] = useState([]);
  const [msg, setMsg] = useState('');

  const fetchQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/quiz');
      setQuizzes(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchQuizzes(); }, []);

  useEffect(() => {
    if (form.year && form.semester) {
      apiRequest(`/subject?year=${form.year}&semester=${form.semester}`)
        .then(setSubjects)
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [form.year, form.semester]);

  const handleQChange = (idx, field, value) => {
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q)
    }));
  };
  const handleOptChange = (qIdx, oIdx, value) => {
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === qIdx ? {
        ...q, options: q.options.map((o, oi) => oi === oIdx ? value : o)
      } : q)
    }));
  };
  const addQuestion = () => {
    setForm(f => ({ ...f, questions: [...f.questions, { text: '', options: ['', '', '', ''], correctOption: 0, marks: 1 }] }));
  };
  const removeQuestion = idx => {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const mappedForm = {
        ...form,
        year: form.year.replace('E-', 'E'),
        semester: form.semester === '1' ? 'sem1' : form.semester === '2' ? 'sem2' : form.semester,
        questions: form.questions.map(q => ({
          questionText: q.text,
          options: q.options,
          correctOption: q.correctOption,
          marks: q.marks
        }))
      };
      if (editQuizId) {
        await apiRequest(`/quiz/${editQuizId}`, {
          method: 'PUT',
          body: JSON.stringify(mappedForm)
        });
        setMsg('Quiz updated!');
      } else {
        await apiRequest('/quiz', {
          method: 'POST',
          body: JSON.stringify(mappedForm)
        });
        setMsg('Quiz created!');
      }
      setForm({ title: '', subject: '', section: '', year: '', semester: '', deadline: '', questions: [{ text: '', options: ['', '', '', ''], correctOption: 0, marks: 1 }] });
      setEditQuizId(null);
      fetchQuizzes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditQuiz = quiz => {
    setEditQuizId(quiz._id);
    setForm({
      title: quiz.title || '',
      subject: quiz.subject || '',
      section: quiz.section || '',
      year: quiz.year ? quiz.year.replace('E', 'E-') : '',
      semester: quiz.semester === 'sem1' ? '1' : quiz.semester === 'sem2' ? '2' : quiz.semester || '',
      deadline: quiz.deadline ? quiz.deadline.substr(0, 10) : '',
      questions: quiz.questions.map(q => ({
        text: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        marks: q.marks
      }))
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditQuizId(null);
    setForm({ title: '', subject: '', section: '', year: '', semester: '', deadline: '', questions: [{ text: '', options: ['', '', '', ''], correctOption: 0, marks: 1 }] });
  };

  // Delete quiz handler
  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    setError('');
    setMsg('');
    try {
      await apiRequest(`/quiz/${id}`, { method: 'DELETE' });
      setMsg('Quiz deleted!');
      if (viewQuiz && viewQuiz._id === id) setViewQuiz(null);
      fetchQuizzes();
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Quiz Management</h2>
      <div className="bg-white shadow-lg rounded-lg p-6 mb-10">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Quiz Title" className="p-2 border rounded w-full" required />
          <select name="section" value={form.section} onChange={handleChange} className="p-2 border rounded w-full" required>
            <option value="">Section</option>
            {['CSE-01', 'CSE-02', 'CSE-03', 'CSE-04', 'CSE-05', 'CSE-06'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select name="year" value={form.year} onChange={handleChange} className="p-2 border rounded w-full" required>
            <option value="">Year</option>
            {['E-1', 'E-2', 'E-3', 'E-4'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select name="semester" value={form.semester} onChange={handleChange} className="p-2 border rounded w-full" required>
            <option value="">Sem</option>
            {['1', '2'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select name="subject" value={form.subject} onChange={handleChange} className="p-2 border rounded" required disabled={subjects.length === 0}>
            <option value="">{subjects.length === 0 ? 'No subjects available' : 'Subject'}</option>
            {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
          <input name="deadline" type="date" value={form.deadline} onChange={handleChange} placeholder="Deadline" className="p-2 border rounded w-full" required />
          <div className="space-y-4">
            {form.questions.map((q, idx) => (
              <details key={idx} className="border rounded bg-gray-50 mb-2" open={idx === 0}>
                <summary className="flex items-center justify-between px-4 py-2 cursor-pointer select-none">
                  <span className="font-semibold">Question {idx + 1}</span>
                  <span>
                    {form.questions.length > 1 && <button type="button" onClick={e => { e.preventDefault(); removeQuestion(idx); }} className="text-red-600 ml-4">Remove</button>}
                  </span>
                </summary>
                <div className="p-4 pt-0">
                  <input value={q.text} onChange={e => handleQChange(idx, 'text', e.target.value)} placeholder="Question text" className="p-2 border rounded w-full mb-2" required />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    {q.options.map((opt, oIdx) => (
                      <input key={oIdx} value={opt} onChange={e => handleOptChange(idx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} className="p-2 border rounded" required />
                    ))}
                  </div>
                  <div className="flex gap-4 items-center">
                    <label>Correct Option:</label>
                    <select value={q.correctOption} onChange={e => handleQChange(idx, 'correctOption', Number(e.target.value))} className="border rounded p-1">
                      {q.options.map((_, oIdx) => <option key={oIdx} value={oIdx}>{oIdx + 1}</option>)}
                    </select>
                    <input type="number" value={q.marks} onChange={e => handleQChange(idx, 'marks', Number(e.target.value))} className="p-2 border rounded w-24" min="1" placeholder="Marks" required />
                  </div>
                </div>
              </details>
            ))}
          </div>
          <button type="button" onClick={addQuestion} className="mt-2 px-4 py-2 bg-primary text-white rounded">Add Question</button>
          <button type="submit" className="ml-4 mt-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
            {editQuizId ? 'Update Quiz' : 'Create Quiz'}
          </button>
          {editQuizId && (
            <button type="button" className="mt-4 ml-4 px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </form>
      </div>

      {msg && <div className="mb-4 text-green-600">{msg}</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <h3 className="text-xl font-bold mt-12 mb-4 border-b pb-2">Existing Quizzes</h3>
      {loading ? (
        <div>Loading quizzes...</div>
      ) : quizzes.length > 0 ? (
        <table className="w-full border mt-2 shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Subject</th>
              <th className="p-2 text-left">Section</th>
              <th className="p-2 text-left">Year</th>
              <th className="p-2 text-left">Semester</th>
              <th className="p-2 text-left">Deadline</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map(quiz => (
              <React.Fragment key={quiz._id}>
                <tr className="border-t">
                  <td className="p-2">{quiz.title}</td>
                  <td className="p-2">{quiz.subject}</td>
                  <td className="p-2">{quiz.section}</td>
                  <td className="p-2">{quiz.year}</td>
                  <td className="p-2">{quiz.semester}</td>
                  <td className="p-2">{quiz.deadline?.substr(0, 10)}</td>
                  <td className="p-2 space-x-2 text-center">
                    <button
  onClick={() => setViewQuiz(viewQuiz && viewQuiz._id === quiz._id ? null : quiz)}
  aria-label={viewQuiz && viewQuiz._id === quiz._id ? 'Hide Quiz Details' : 'View Quiz Details'}
  className="inline-flex items-center p-1 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
>
  {viewQuiz && viewQuiz._id === quiz._id ? <EyeOffIcon className="text-green-600" /> : <EyeIcon className="text-green-600" />}
</button>
                    <button
  onClick={() => handleEditQuiz(quiz)}
  aria-label="Edit Quiz"
  className="inline-flex items-center p-1 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
>
  <EditIcon className="text-blue-600" />
</button>
                    <button
  onClick={() => handleDeleteQuiz(quiz._id)}
  aria-label="Delete Quiz"
  className="inline-flex items-center p-1 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
>
  <TrashIcon className="text-red-600" />
</button>
                  </td>
                </tr>
                {viewQuiz && viewQuiz._id === quiz._id && (
                  <tr>
                    <td colSpan="8" className="bg-gray-50 p-4">
                      <h4 className="font-semibold mb-2">Questions</h4>
                      <ol className="list-decimal ml-6">
                        {viewQuiz.questions.map((q, i) => (
                          <li key={i} className="mb-2">
                            <div className="font-medium">{q.questionText}</div>
                            <ul className="list-disc ml-6">
                              {q.options.map((opt, oi) => (
                                <li key={oi} className={q.correctOption === oi ? 'font-bold text-green-700' : ''}>{opt}</li>
                              ))}
                            </ul>
                            <div className="text-xs text-gray-600">Marks: {q.marks}</div>
                          </li>
                        ))}
                      </ol>
                      <button className="mt-2 text-sm text-red-600 underline" onClick={() => setViewQuiz(null)}>Close</button>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No quizzes found.</div>
      )}
    </div>
  );
}
