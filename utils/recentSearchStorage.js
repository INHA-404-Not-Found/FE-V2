import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_SEARCH_KEY = "recent_searches";
const MAX_RECENT_SEARCHES = 10;

export const getRecentSearches = async () => {
  try {
    const value = await AsyncStorage.getItem(RECENT_SEARCH_KEY);
    return value ? JSON.parse(value) : [];
  } catch (e) {
    console.error("최근 검색어 조회 오류:", e.message);
    return [];
  }
};

const saveRecentSearches = async (keywords) => {
  try {
    await AsyncStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(keywords));
  } catch (e) {
    console.error("최근 검색어 저장 오류:", e.message);
  }
};

// 같은 검색어는 맨 앞으로 옮기고, 최대 개수만큼만 유지
export const addRecentSearch = async (keyword) => {
  const trimmed = keyword?.trim();
  if (!trimmed) return;

  const keywords = await getRecentSearches();
  const next = [trimmed, ...keywords.filter((k) => k !== trimmed)].slice(
    0,
    MAX_RECENT_SEARCHES,
  );
  await saveRecentSearches(next);
};

export const removeRecentSearch = async (keyword) => {
  const keywords = await getRecentSearches();
  const next = keywords.filter((k) => k !== keyword);
  await saveRecentSearches(next);
  return next;
};

export const clearRecentSearches = async () => {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCH_KEY);
  } catch (e) {
    console.error("최근 검색어 삭제 오류:", e.message);
  }
};
