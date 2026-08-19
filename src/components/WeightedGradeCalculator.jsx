import React, { useState } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';

// Converts numeric grade (0-100) to 4.0 GPA scale
const getGpaPoints = (grade) => {
  if (grade >= 90) return 4.0;
  if (grade >= 85) return 3.7;
  if (grade >= 80) return 3.3;
  if (grade >= 75) return 3.0;
  if (grade >= 70) return 2.7;
  if (grade >= 65) return 2.3;
  if (grade >= 60) return 2.0;
  return 0.0;
};

export default function WeightedGradeCalculator() {
  const [courses, setCourses] = useState([
    {
      id: 1,
      name: 'CHEM 202',
      credits: 3,
      assessments: [
        { id: 1, name: 'Exams', weight: 40, grade: 80 },
        { id: 2, name: 'Assignments', weight: 40, grade: 90 },
        { id: 3, name: 'Attendance', weight: 20, grade: 100 }
      ]
    }
  ]);

  // Add a new Course
  const addCourse = () => {
    setCourses([
      ...courses,
      {
        id: Date.now(),
        name: `Course ${courses.length + 1}`,
        credits: 3,
        assessments: [
          { id: 1, name: 'Midterm', weight: 40, grade: 85 },
          { id: 2, name: 'Final Exam', weight: 60, grade: 90 }
        ]
      }
    ]);
  };

  // Remove a Course
  const removeCourse = (courseId) => {
    setCourses(courses.filter((c) => c.id !== courseId));
  };

  // Update Course Name or Credits
  const updateCourse = (courseId, key, value) => {
    setCourses(
      courses.map((c) => (c.id === courseId ? { ...c, [key]: value } : c))
    );
  };

  // Add Assessment to Course
  const addAssessment = (courseId) => {
    setCourses(
      courses.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            assessments: [
              ...c.assessments,
              { id: Date.now(), name: 'Quiz / Homework', weight: 10, grade: 85 }
            ]
          };
        }
        return c;
      })
    );
  };

  // Remove Assessment
  const removeAssessment = (courseId, assessmentId) => {
    setCourses(
      courses.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            assessments: c.assessments.filter((a) => a.id !== assessmentId)
          };
        }
        return c;
      })
    );
  };

  // Update Assessment Item
  const updateAssessment = (courseId, assessmentId, key, value) => {
    setCourses(
      courses.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            assessments: c.assessments.map((a) =>
              a.id === assessmentId ? { ...a, [key]: value } : a
            )
          };
        }
        return c;
      })
    );
  };

  // Calculate course score
  const getCourseResult = (assessments) => {
    let totalWeight = 0;
    let weightedSum = 0;

    assessments.forEach((a) => {
      const w = parseFloat(a.weight) || 0;
      const g = parseFloat(a.grade) || 0;
      totalWeight += w;
      weightedSum += (w * g) / 100;
    });

    const finalGrade = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    return { totalWeight, finalGrade };
  };

  // Overall Term Cumulative GPA Calculation
  let totalCredits = 0;
  let totalGpaPoints = 0;

  courses.forEach((c) => {
    const credits = parseFloat(c.credits) || 0;
    const { finalGrade } = getCourseResult(c.assessments);
    const gpaPoints = getGpaPoints(finalGrade);

    totalCredits += credits;
    totalGpaPoints += gpaPoints * credits;
  });

  const cumulativeGpa = totalCredits > 0 ? (totalGpaPoints / totalCredits).toFixed(2) : '0.00';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Overall Summary Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0B1A3F 0%, #1E3A8A 100%)',
          color: '#FFFFFF',
          padding: '24px',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(11,26,63,0.15)'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Term GPA Overview</h2>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '13px' }}>
            Calculated across {courses.length} course{courses.length !== 1 ? 's' : ''} ({totalCredits} Total Credits)
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
            Cumulative GPA
          </span>
          <div style={{ fontSize: '36px', fontWeight: '900', lineHeight: 1 }}>{cumulativeGpa} / 4.0</div>
        </div>
      </div>

      {/* Courses List */}
      {courses.map((course) => {
        const { totalWeight, finalGrade } = getCourseResult(course.assessments);
        return (
          <div
            key={course.id}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5EAF2',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.03)'
            }}
          >
            {/* Course Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                paddingBottom: '14px',
                borderBottom: '1px solid #F0F4F8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={20} color="#0B1A3F" />
                <input
                  type="text"
                  value={course.name}
                  onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                  style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    border: 'none',
                    outline: 'none',
                    color: '#0B1A3F',
                    background: 'transparent'
                  }}
                  placeholder="Course Name (e.g., CHEM 202)"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#5B667A' }}>
                  Credits:{' '}
                  <input
                    type="number"
                    value={course.credits}
                    onChange={(e) => updateCourse(course.id, 'credits', e.target.value)}
                    style={{
                      width: '45px',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: '1px solid #DCE4EF',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  />
                </label>

                {courses.length > 1 && (
                  <button
                    onClick={() => removeCourse(course.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                    title="Remove Course"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Assessment Table Headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 40px',
                gap: '12px',
                marginBottom: '8px',
                padding: '0 4px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#5B667A' }}>ASSESSMENT NAME</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#5B667A' }}>WEIGHT (%)</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#5B667A' }}>GRADE GOT (%)</span>
              <span></span>
            </div>

            {/* Assessment Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {course.assessments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 40px',
                    gap: '12px',
                    alignItems: 'center'
                  }}
                >
                  <input
                    type="text"
                    value={a.name}
                    onChange={(e) => updateAssessment(course.id, a.id, 'name', e.target.value)}
                    placeholder="Assessment Name"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  />

                  <input
                    type="number"
                    value={a.weight}
                    onChange={(e) => updateAssessment(course.id, a.id, 'weight', e.target.value)}
                    placeholder="Weight %"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  />

                  <input
                    type="number"
                    value={a.grade}
                    onChange={(e) => updateAssessment(course.id, a.id, 'grade', e.target.value)}
                    placeholder="Grade"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  />

                  <button
                    onClick={() => removeAssessment(course.id, a.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Course Footer Summary */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px dashed #E2E8F0'
              }}
            >
              <button
                onClick={() => addAssessment(course.id)}
                style={{
                  background: '#F1F5F9',
                  color: '#0B1A3F',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} /> Add Assessment
              </button>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: totalWeight === 100 ? '#10B981' : '#EAB308'
                  }}
                >
                  Total Weight: {totalWeight}%
                </span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#0B1A3F' }}>
                  Course Average: {finalGrade.toFixed(2)}% ({getGpaPoints(finalGrade).toFixed(1)} pts)
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add Course Button */}
      <button
        onClick={addCourse}
        style={{
          background: '#FFFFFF',
          color: '#0B1A3F',
          border: '2px dashed #CBD5E1',
          padding: '14px',
          borderRadius: '16px',
          fontWeight: '800',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <Plus size={18} /> Add Another Course
      </button>
    </div>
  );
}