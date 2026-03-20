export function buildOhifStudyUrl(studyInstanceUid: string) {
  return `/imaging/ohif/viewer?StudyInstanceUIDs=${encodeURIComponent(studyInstanceUid)}`;
}
