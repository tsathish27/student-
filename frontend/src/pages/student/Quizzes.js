import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import SemesterSelect from './SemesterSelect';
import { useAuth } from '../../context/AuthContext';

function Quizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [takingQuiz, setTakingQuiz] = useState(null); // quiz object
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');

  // Add state for profile info (use semester as in model: '1' or '2')
  const [profile, setProfile] = useState({ section: '', year: '', semester: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Filter state for quiz list
  const [filter, setFilter] = useState({ subject: '', search: '' });
  // Timer state
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // --- Add subjects state and fetch subjects for the student's section/year/semester ---
  const [subjects, setSubjects] = useState([]);

  // Fetch student profile FIRST
  useEffect(() => {
    setProfileLoading(true);
    setProfileError('');
    apiRequest('/student/my')
      .then(res => {
        let sem = res.semester;
        if (sem === 'sem1' || sem === '1') sem = '1';
        else if (sem === 'sem2' || sem === '2') sem = '2';
        setProfile({
          section: res.section || '',
          year: res.year || '',
          semester: sem || ''
        });
        setProfileLoading(false);
      })
      .catch((err) => {
        setProfile({ section: '', year: '', semester: '' });
        setProfileError('Failed to load student profile.');
        setProfileLoading(false);
      });
  }, []);

  // Handler for semester change by student
  const handleSemesterChange = (sem) => {
    setProfile(p => ({ ...p, semester: sem }));
    // Persist semester to backend
    apiRequest('/student/semester', {
      method: 'PUT',
      body: JSON.stringify({ semester: sem }),
    }).catch(() => {});
  };


  // Fetch subjects when profile is loaded
  useEffect(() => {
    if (profileLoading || !profile.year || !profile.semester) return;
    const normSem = s => (s === 'sem1' || s === '1') ? '1' : (s === 'sem2' || s === '2') ? '2' : s;
    apiRequest(`/subject?year=${encodeURIComponent(profile.year)}&semester=${encodeURIComponent(normSem(profile.semester))}`)
      .then(res => setSubjects(Array.isArray(res) ? res : []))
      .catch(() => setSubjects([]));
  }, [profile, profileLoading]);

  // Fetch quizzes when profile is loaded
  useEffect(() => {
    if (!user || !user._id || profileLoading || !profile.year || !profile.semester) return;
    setLoading(true);
    setError('');
    apiRequest(`/quiz/all-with-status/me`)
      .then(data => {
        setQuizzes(Array.isArray(data) ? data : []);
        // Map attempts to include display fields for table
        setAttempts(Array.isArray(data)
          ? data.filter(q => q.status === 'Attempted' && q.attempt).map(q => ({
              _id: q.attempt._id,
              quizId: q._id,
              quizTitle: q.title,
              score: q.attempt.score,
              totalMarks: q.questions.reduce((sum, qq) => sum + (qq.marks || 1), 0),
              submittedAt: q.attempt.submittedAt || q.attempt.createdAt || q.attempt.updatedAt || null,
            }))
          : []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, profile, profileLoading]);

  const startQuiz = async quiz => {
  if (quiz.status === 'Attempted' && quiz.attempt) {
    setLoading(true);
    try {
      // Fetch review data from backend
      const review = await apiRequest(`/quiz/review/${quiz._id}`);
      setTakingQuiz({
        ...quiz,
        review: true,
        reviewQuestions: review.questions,
        reviewScore: review.score,
        reviewTotalMarks: review.totalMarks,
        reviewCorrectCount: review.correctCount,
        reviewIncorrectCount: review.incorrectCount
      });
      setResult({
        score: review.score,
        totalMarks: review.totalMarks,
        correctCount: review.correctCount,
        incorrectCount: review.incorrectCount
      });
    } catch (e) {
      setMsg('Failed to load review data.');
    } finally {
      setLoading(false);
    }
  } else {
      setTakingQuiz(quiz);
      setAnswers({});
      setResult(null);
      setMsg('');
    }
  };
  const handleAnswer = (qid, optIdx) => setAnswers(a => ({ ...a, [qid]: optIdx }));
  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await apiRequest(`/quiz/${takingQuiz._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption })) })
      });
      setResult(res);
      setMsg('Quiz submitted!');
      // Add the new attempt to the attempts list for immediate feedback
      setAttempts(prev => [
        {
          _id: res.attemptId || (res.attempt && res.attempt._id) || Math.random().toString(36).substr(2, 9),
          quizId: takingQuiz._id,
          quizTitle: takingQuiz.title,
          score: res.score,
          totalMarks: res.totalMarks,
          submittedAt: new Date().toISOString(),
        },
        ...prev.filter(at => at.quizId !== takingQuiz._id) // replace any previous attempt for this quiz
      ]);
    } catch (err) {
      setMsg('Failed to submit quiz.');
    }
  };

  // --- Remove subject/search filter for initial All Quizzes section ---
  const allQuizzes = quizzes; // Show all quizzes as received from backend

  // --- Keep filteredQuizzes for subject/search filtering if needed elsewhere ---
  const filteredQuizzes = quizzes.filter(qz => {
    let match = true;
    if (filter.subject) match = match && qz.subject === filter.subject;
    if (filter.search) match = match && qz.title.toLowerCase().includes(filter.search.toLowerCase());
    return match;
  });

  // Add timer logic when taking a quiz
  useEffect(() => {
    if (takingQuiz && takingQuiz.duration) {
      setTimeLeft(takingQuiz.duration * 60); // duration in minutes
      setTimer(setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000));
      return () => clearInterval(timer);
    } else {
      setTimeLeft(null);
      if (timer) clearInterval(timer);
    }
  }, [takingQuiz]);

  // Prevent multiple attempts
  const hasAttempted = quizId => attempts.some(at => at.quizId === quizId);

  // Quiz feedback: show correct/incorrect after submission
  const getFeedback = (qid, idx) => {
    if (!result || !result.answers) return '';
    const answer = result.answers.find(a => a.questionId === qid);
    if (!answer) return '';
    if (answer.selectedOption === idx && answer.isCorrect) return '✔️';
    if (answer.selectedOption === idx && !answer.isCorrect) return '❌';
    if (answer.correctOption === idx) return '✅';
    return '';
  };

  const displaySemester = sem => {
    if (sem === 'sem1' || sem === '1') return 'Semester 1';
    if (sem === 'sem2' || sem === '2') return 'Semester 2';
    return sem;
  };

  if (takingQuiz) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Quiz: {takingQuiz.title}</h2>
        {takingQuiz.duration && !takingQuiz.review && (
          <div className="mb-4 text-lg font-semibold text-red-600">Time Left: {timeLeft !== null ? `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}` : '--:--'}</div>
        )}
        {takingQuiz.review ? (
          <div>
            <h3 className="text-xl font-bold mb-4">Quiz Review</h3>
            {Array.isArray(takingQuiz.reviewQuestions) && takingQuiz.reviewQuestions.map((q, idx) => (
  <div key={q.questionId} className="border rounded p-4 mb-4 bg-gray-50">
    <div className="font-semibold mb-2">Q{idx + 1}. {q.questionText || q.text}</div>
    <div className="mb-2">
      {q.submittedOption !== null ? (
        q.isCorrect ? (
          <span className="inline-flex items-center text-green-700 font-semibold">
            <span className="mr-1">✔️</span>
            Your answer was correct: <span className="ml-2 bg-green-100 px-2 py-1 rounded">{q.submittedOptionText} (#{q.submittedOption})</span>
          </span>
        ) : (
          <>
            <span className="inline-flex items-center text-red-700 font-semibold">
              <span className="mr-1">❌</span>
              Your answer: <span className="ml-2 bg-red-100 px-2 py-1 rounded">{q.submittedOptionText} (#{q.submittedOption})</span>
            </span>
            <br />
            <span className="inline-flex items-center text-green-700 font-semibold mt-1">
              <span className="mr-1">✔️</span>
              Correct answer: <span className="ml-2 bg-green-100 px-2 py-1 rounded">{q.correctOptionText} (#{q.correctOption})</span>
            </span>
          </>
        )
      ) : (
        <span className="text-gray-500">No answer submitted.</span>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {q.options.map((opt, oIdx) => {
        const isCorrect = q.correctOption === oIdx;
        const isSelected = q.submittedOption === oIdx;
        let optionClass = '';
        if (isCorrect) optionClass += ' bg-green-100';
        if (isSelected && !isCorrect) optionClass += ' bg-blue-100';
        if (isSelected) optionClass += ' font-bold underline';
        return (
          <div key={oIdx} className={`flex items-center gap-2 rounded px-2 py-1${optionClass}`}>
            <input
              type="radio"
              checked={isSelected}
              disabled
            />
            {opt}
            {isSelected && (
              <span className={isCorrect ? "text-green-700 font-bold ml-2" : "text-blue-700 font-bold ml-2"}>
                (Your Answer)
              </span>
            )}
            {!isSelected && isCorrect && (
              <span className="text-green-700 font-bold ml-2">(Correct Answer)</span>
            )}
          </div>
        );
      })}
    </div>
  </div>
))}
            <div className="mt-6 p-4 bg-green-100 rounded">
              <div className="font-bold">Your Score: {takingQuiz.reviewScore ?? 0} / {takingQuiz.reviewTotalMarks ?? 0}</div>
              <div>
                Correct: {takingQuiz.reviewCorrectCount ?? 0} |
                Incorrect: {takingQuiz.reviewIncorrectCount ?? 0}
              </div>
              <button
                className="mt-4 bg-primary text-white px-6 py-2 rounded"
                onClick={() => {
                  setTakingQuiz(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {takingQuiz.questions.map((q, idx) => (
              <div key={q._id} className="border rounded p-4 mb-2 bg-gray-50">
                <div className="font-semibold mb-2">Q{idx + 1}. {q.text || q.questionText}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q_${q._id}`}
                        value={oIdx}
                        checked={answers[q._id] === oIdx}
                        onChange={() => handleAnswer(q._id, oIdx)}
                        required
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button className="bg-primary text-white px-6 py-2 rounded" type="submit">Submit Quiz</button>
            <button type="button" className="ml-4 px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setTakingQuiz(null)}>Cancel</button>
          </form>
        )}
        {msg && <div className="mt-4 text-green-600">{msg}</div>}
        {result && !takingQuiz.review && (
          <div className="mt-6 p-4 bg-green-100 rounded">
            <div className="font-bold">Your Score: {typeof result.score !== 'undefined' ? result.score : 0} / {typeof result.totalMarks !== 'undefined' ? result.totalMarks : quizzes.find(q => q._id === takingQuiz?._id)?.questions?.length || 0}</div>
            <div>
              Correct: {typeof result.correctCount !== 'undefined' ? result.correctCount : 0} |
              Incorrect: {typeof result.incorrectCount !== 'undefined' ? result.incorrectCount : 0}
            </div>
            <button
              className="mt-4 bg-primary text-white px-6 py-2 rounded"
              onClick={() => {
                setTakingQuiz(null);
                setResult(null);
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* FILTERS ROW */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="text"
          className="border rounded p-2 w-48"
          placeholder="Search by title"
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
        />
        <SemesterSelect
          value={profile.semester}
          onChange={handleSemesterChange}
          disabled={profileLoading}
        />
        <select
          className="border rounded p-2 w-40"
          value={filter.subject}
          onChange={e => setFilter(f => ({ ...f, subject: e.target.value }))}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s._id || s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
      {/* SECTION INFO */}
      <div className="mb-4 text-gray-500 text-sm">
        {profile.section && profile.year && profile.semester ? (
          <>Showing quizzes for your section: <b>{profile.section}</b>, year: <b>{profile.year}</b>, semester: <b>{displaySemester(profile.semester)}</b></>
        ) : (
          <span>Please select a semester to view your quizzes.</span>
        )}
      </div>
      {/* QUIZZES TABLE */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-bold mb-4">My Quizzes</h2>
        <table className="w-full border text-sm rounded-xl overflow-x-auto">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="bg-gray-100">
              <th className="p-2 text-center">Title</th>
              <th className="p-2 text-center">Subject</th>
              <th className="p-2 text-center">Deadline</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtered = quizzes.filter(qz =>
                (!filter.search || qz.title.toLowerCase().includes(filter.search.toLowerCase())) &&
                (!filter.subject || qz.subject === filter.subject)
              );
              return filtered.length > 0 ? (
                filtered.map(qz => (
                  <tr key={qz._id} className="border-t hover:bg-blue-50 transition-all">
                    <td className="p-2 text-center">{qz.title}</td>
                    <td className="p-2 text-center">{qz.subject}</td>
                    <td className="p-2 text-center">{qz.deadline ? new Date(qz.deadline).toLocaleString() : '-'}</td>
                    <td className="p-2 text-center">
                      {qz.status === 'Attempted' && <span className="text-green-700 font-semibold">Attempted</span>}
                      {qz.status === 'Missed' && <span className="text-red-700 font-semibold">Missed</span>}
                      {qz.status === 'Available' && <span className="text-blue-700 font-semibold">Available</span>}
                    </td>
                    <td className="p-2 text-center">
                      {qz.status === 'Available' && (
                        <button
                          className="bg-primary text-white px-4 py-1 rounded hover:bg-blue-700"
                          onClick={() => startQuiz(qz)}
                        >
                          Take Quiz
                        </button>
                      )}
                      {qz.status === 'Attempted' && (
                        <button
                          className="bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-800"
                          onClick={() => startQuiz(qz)}
                        >
                          Review
                        </button>
                      )}
                      {qz.status === 'Missed' && (
                        <span className="text-gray-400">Missed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-600">
                    {loading ? 'Loading...' : 'No quizzes found.'}
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>
      <hr className="my-8 border-t-2 border-gray-200" />
      <div className="bg-white rounded-xl shadow p-4 mt-6">
        <h2 className="text-xl font-bold mb-4">My Quiz Attempts</h2>
        {attempts.length > 0 ? (
          <table className="w-full border text-sm rounded-xl overflow-x-auto">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="bg-gray-100">
                <th className="p-2 text-center">Quiz</th>
                <th className="p-2 text-center">Score</th>
                <th className="p-2 text-center">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map(qz => {
                  const at = attempts.find(a => a.quizId === qz._id);
                  if (at) {
                    // Attempted
                    return (
                      <tr key={at._id} className="border-t hover:bg-blue-50 transition-all">
                        <td className="p-2 text-center">{at.quizTitle}</td>
                        <td className="p-2 text-center">{at.score} / {at.totalMarks}</td>
                        <td className="p-2 text-center">{at.submittedAt ? new Date(at.submittedAt).toLocaleString() : '-'}</td>
                      </tr>
                    );
                  } else if (qz.status === 'Missed') {
                    // Missed
                    const totalMarks = qz.questions ? qz.questions.reduce((sum, qq) => sum + (qq.marks || 1), 0) : 0;
                    return (
                      <tr key={qz._id} className="border-t hover:bg-blue-50 transition-all">
                        <td className="p-2 text-center">{qz.title}</td>
                        <td className="p-2 text-center">0 / {totalMarks}</td>
                        <td className="p-2 text-center">-</td>
                      </tr>
                    );
                  } else {
                    return null;
                  }
                })}
            </tbody>
          </table>
        ) : (
          !loading && <div className="text-gray-600">No quiz attempts found.</div>
        )}
      </div>
    </div>
  );
};

export default Quizzes;
