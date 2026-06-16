import { queryOne } from '../database/init';

interface ExamSubmission {
  id: number;
  student_id: number;
  certificate_id: number;
  exam_date: string;
  score: number;
  result_file_url: string;
}

interface AiReviewResult {
  result: 'pass' | 'need_material' | 'fail';
  confidence: number;
  comment: string;
  details: {
    materialComplete: boolean;
    scorePassed: boolean;
    prerequisitesMet: boolean;
    scoreThreshold: number;
  };
}

const SCORE_THRESHOLD = 60;

/**
 * AI 审核引擎
 * 模拟 AI 审核逻辑，检查提交材料的完整性和合规性
 */
export function aiReview(submission: ExamSubmission): AiReviewResult {
  const details = {
    materialComplete: false,
    scorePassed: false,
    prerequisitesMet: true,
    scoreThreshold: SCORE_THRESHOLD,
  };

  const comments: string[] = [];

  // 1. 检查材料完整性
  details.materialComplete = !!submission.result_file_url && submission.result_file_url.length > 0;
  if (!details.materialComplete) {
    comments.push('缺少考试结果附件材料，请补充成绩单或证书扫描件');
  } else {
    comments.push('材料提交完整');
  }

  // 2. 检查成绩是否合格
  details.scorePassed = submission.score >= SCORE_THRESHOLD;
  if (!details.scorePassed) {
    comments.push(`考试成绩 ${submission.score} 分未达到及格线 ${SCORE_THRESHOLD} 分`);
  } else {
    comments.push(`考试成绩 ${submission.score} 分，达到及格线要求`);
  }

  // 3. 检查前置条件
  const registration = queryOne(
    'SELECT status FROM student_registrations WHERE student_id = ? AND certificate_id = ? ORDER BY created_at DESC LIMIT 1',
    [submission.student_id, submission.certificate_id]
  ) as { status: string } | undefined;

  if (!registration) {
    details.prerequisitesMet = false;
    comments.push('未找到对应的报名审批记录，请先在系统内完成报名');
  } else if (registration.status !== 'approved') {
    details.prerequisitesMet = false;
    comments.push('报名尚未通过审核，请等待报名审核完成后再提交考试信息');
  } else {
    comments.push('报名审核已通过，前置条件满足');
  }

  // 4. 综合判定
  let result: 'pass' | 'need_material' | 'fail';
  let confidence: number;

  if (details.materialComplete && details.scorePassed && details.prerequisitesMet) {
    result = 'pass';
    confidence = 0.85 + Math.random() * 0.13;
    comments.push('综合评估：通过。材料完整，成绩合格，前置条件满足。');
  } else if (!details.materialComplete) {
    result = 'need_material';
    confidence = 0.75 + Math.random() * 0.15;
    comments.push('综合评估：需补充材料。请完善考试材料后重新提交审核。');
  } else {
    result = 'fail';
    confidence = 0.8 + Math.random() * 0.15;
    comments.push('综合评估：不通过。请检查未满足的条件后重新提交。');
  }

  return {
    result,
    confidence: Math.round(confidence * 100) / 100,
    comment: comments.join('；'),
    details,
  };
}

export async function aiReviewWithApi(submission: ExamSubmission): Promise<AiReviewResult> {
  return aiReview(submission);
}
