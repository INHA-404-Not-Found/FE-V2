// 게시글 완료 여부 필터 값(BE PostStatus)과 화면 표시 이름
export const STATUS_OPTIONS = [
  { id: "UNCOMPLETED", name: "미완료" },
  { id: "COMPLETED", name: "완료" },
  { id: "POLICE", name: "인계됨" },
];
export const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.id, o.name]),
);
