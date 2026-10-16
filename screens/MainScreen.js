import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { ScrollView } from "react-native-gesture-handler";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { StatusBar } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import BottomBar from "../components/BottomBar";
import CategoryList from "../components/CategoryList";
import CheckboxGrid from "../components/CheckboxGrid";
import DefaultHeader from "../components/DefaultHeader";
import LocationViewBox from "../components/LocationViewBox";
import PostTypeSelector from "../components/PostTypeSelector";
import RecentSearchChips from "../components/RecentSearchChips";
import { STATUS_LABELS, STATUS_OPTIONS } from "../constants/postStatus";
import { setKeyword } from "../Redux/slices/keywordSlice";
import { addRecentSearch } from "../utils/recentSearchStorage";
const FILTER_TABS = [
  { id: "category", name: "물품 카테고리" },
  { id: "location", name: "습득/분실 위치" },
  { id: "status", name: "완료 여부" },
];
const MainScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const keyword = useSelector((s) => s.search.keyword);
  const [selectType, setSelectType] = useState("category"); // category location status
  const [postType, setPostType] = useState("ALL"); // ALL FIND LOST
  const [selectedCate, setSelectedCate] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [state, setState] = useState(""); // "" UNCOMPLETED COMPLETED POLICE
  // 하단 바가 absolute로 떠 있어 스크롤 끝 내용을 가리므로, 바 높이만큼 아래 여백을 더한다
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  // bottomSheet
  const bottomSheetModalRef = useRef(null);
  const handleModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  // 등록 화면으로 이동할 때 시트를 닫아, 뒤로 돌아왔을 때 열린 채로 남지 않게 한다
  const navigateFromSheet = (screen) => {
    bottomSheetModalRef.current?.dismiss();
    navigation.navigate(screen);
  };
  const handleSheetChanges = useCallback((index) => {
    console.log("bottomSheetChanges", index);
  }, []);
  // 검색어를 최근 검색어에 저장하고 현재 필터와 함께 목록으로 이동
  const goSearch = (word) => {
    addRecentSearch(word);
    navigation.navigate("PostListScreen", {
      category: selectedCate,
      location: selectedLocation,
      state: state,
      postType: postType,
    });
  };
  // 선택된 필터를 태그로 보여주고, 태그를 누르면 그 필터만 해제한다
  const selectedTags = [
    selectedCate && {
      key: "category",
      name: selectedCate.name,
      onRemove: () => setSelectedCate(null),
    },
    selectedLocation && {
      key: "location",
      name: selectedLocation.name,
      onRemove: () => setSelectedLocation(null),
    },
    state && {
      key: "status",
      name: STATUS_LABELS[state],
      onRemove: () => setState(""),
    },
  ].filter(Boolean);
  // 필터링 초기화
  const resetFilter = () => {
    setSelectedCate(null);
    setSelectedLocation(null);
    setState(""); // "" UNCOMPLETED COMPLETED POLICE
  };
  // state 토글, 업데이트
  const handleState = (v) => {
    if (state == "") {
      setState(v);
    } else {
      setState(state === v ? "" : v);
    }
  };
  // snap points (모달 높이)
  const snapPoints = useMemo(() => ["40%"], []);

  // backdrop 생성 함수
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close" // ← 이게 핵심! 눌렀을 때 닫힘
      />
    ),
    [],
  );

  return (
    <BottomSheetModalProvider>
      <StatusBar style="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView
        style={{ flex: 1, paddingBottom: 0, backgroundColor: "#ffffff" }}
        edges={["top"]}
      >
        <DefaultHeader />

        {/* 지도 탭을 열면 작은 화면에서 넘치므로 스크롤. 지도 드래그와 맞물리도록 gesture-handler의 ScrollView 사용 */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentTop,
            { paddingBottom: bottomBarHeight + 25 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.searchBar}>
            <TextInput
              value={keyword}
              onChangeText={(text) => dispatch(setKeyword(text))}
              placeholder="검색어 없음"
              placeholderTextColor="#ffffffff"
              returnKeyType="search"
              onSubmitEditing={() => goSearch(keyword)}
              style={styles.textInput}
            />
            <Pressable onPress={() => goSearch(keyword)}>
              <Image
                source={require("../assets/searchWhite.png")}
                style={styles.barImg}
              ></Image>
            </Pressable>
          </View>
          <RecentSearchChips
            onSelect={(item) => {
              dispatch(setKeyword(item));
              goSearch(item);
            }}
            style={styles.recentChips}
          />
          <View style={styles.selectView}>
            <PostTypeSelector postType={postType} setPostType={setPostType} />
            <View>
              <Pressable
                onPress={resetFilter}
                style={({ pressed }) => [
                  styles.filterResetBtn,
                  pressed && styles.filterResetBtnPressed,
                ]}
              >
                <Image
                  source={require("../assets/filterReset.png")}
                  style={styles.resetImg}
                ></Image>
                <Text style={[styles.BtnText, { color: "#a8a8a8" }]}>
                  필터 초기화
                </Text>
              </Pressable>
            </View>
            <View style={styles.selectBtnRow}>
              {FILTER_TABS.map((tab) => {
                const active = selectType === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setSelectType(tab.id)}
                    style={[styles.selectBtn, active && styles.selectBtnActive]}
                  >
                    <Text
                      style={[
                        styles.selectBtnText,
                        active && styles.selectBtnTextActive,
                      ]}
                    >
                      {tab.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View>
              {selectType === "category" && (
                <CategoryList
                  selected={selectedCate}
                  setSelected={setSelectedCate}
                />
              )}
              {selectType === "location" && (
                <View style={{ height: 250 }}>
                  <LocationViewBox
                    selected={selectedLocation}
                    setSelected={setSelectedLocation}
                  />
                </View>
              )}
              {selectType === "status" && (
                <CheckboxGrid
                  items={STATUS_OPTIONS}
                  selectedId={state}
                  onToggle={(item) => handleState(item.id)}
                />
              )}
            </View>
            {selectedTags.length > 0 && (
              <View style={styles.tagWrap}>
                {selectedTags.map((tag) => (
                  <Pressable
                    key={tag.key}
                    onPress={tag.onRemove}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{tag.name}</Text>
                    <Text style={styles.tagRemove}>✕</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {/* 검색 아이콘과 같은 goSearch로 이동해, 어느 쪽으로 넘어가도 같은 조건이 적용된다 */}
            <Pressable
              onPress={() => goSearch(keyword)}
              style={({ pressed }) => [
                styles.resultBtn,
                pressed && styles.resultBtnPressed,
              ]}
            >
              <Text style={styles.resultBtnText}>결과 보기</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* 하단 바 */}
        <View style={styles.contentBottom}>
          <BottomBar
            handleModalPress={handleModalPress}
            onLayout={(e) => setBottomBarHeight(e.nativeEvent.layout.height)}
          />
        </View>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          style={styles.bottomSheetModal}
          backdropComponent={renderBackdrop}
        >
          <BottomSheetView style={styles.contentContainer}>
            {/* react-native의 SafeAreaView는 Android에서 inset을 적용하지 않아 직접 계산한다 */}
            <View style={{ paddingBottom: insets.bottom }}>
              <View style={styles.bottomModalCards}>
                <Pressable
                  onPress={() => navigateFromSheet("AddPostScreen")}
                  style={({ pressed }) => [
                    styles.bottomModalCard,
                    { backgroundColor: "#e8eef7" },
                    pressed && styles.bottomModalCardPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.bottomModalContentTitleText,
                      { color: "#215294" },
                    ]}
                  >
                    습득 등록
                  </Text>
                  <Text
                    style={[styles.bottomModalDescText, { color: "#4a6d9c" }]}
                  >
                    물건을 주웠어요
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => navigateFromSheet("AddLostPostScreen")}
                  style={({ pressed }) => [
                    styles.bottomModalCard,
                    { backgroundColor: "#e8eef7" },
                    pressed && styles.bottomModalCardPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.bottomModalContentTitleText,
                      { color: "#215294" },
                    ]}
                  >
                    분실 등록
                  </Text>
                  <Text
                    style={[styles.bottomModalDescText, { color: "#4a6d9c" }]}
                  >
                    물건을 잃어버렸어요
                  </Text>
                </Pressable>
              </View>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#DADEE7",
  },
  contentTop: {
    flexGrow: 1,
    flexDirection: "column",
    // 고정 폭(345) 가운데 정렬이면 큰 화면에선 좌우가 넓고 작은 화면에선 넘쳐서, 화면 폭에 맞춰 늘리고 좌우 여백만 둔다
    padding: 22,
    backgroundColor: "#DADEE7",
  },
  // 위아래 간격을 16으로 맞춤 (selectView의 marginTop 25에서 9를 상쇄)
  // 최근 검색어가 없으면 칩이 렌더링되지 않아 검색창-필터 간격은 원래대로 25
  recentChips: {
    marginTop: 16,
    marginBottom: -9,
  },
  searchBar: {
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2165A6",
    flexDirection: "row",
  },
  barImg: {
    margin: 5,
    marginLeft: 0,
    width: 48,
    height: 48,
  },
  textInput: {
    color: "#fff",
    marginLeft: 20,
    flex: 1,
  },
  selectView: {
    height: "content",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderBlockColor: "#DADEE7",
    marginTop: 25,
    padding: 5,
    // 맨 아래가 결과 보기 버튼이라 버튼 아래 여백만 좁힌다
    paddingBottom: 20,
  },
  filterResetBtn: {
    flexDirection: "row",
    alignSelf: "flex-end",
    alignItems: "center",
    gap: 4,
    marginRight: 22,
    padding: 4,
  },
  filterResetBtnPressed: {
    opacity: 0.5,
  },
  resetImg: {
    width: 15,
    height: 15,
  },
  selectBtnRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  selectBtn: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F1F3F7",
  },
  selectBtnActive: {
    backgroundColor: "#2165A6",
  },
  selectBtnText: {
    fontSize: 13,
    color: "#6b7280",
  },
  selectBtnTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  BtnText: {
    fontSize: 13,
  },
  bottomSheetModal: {
    borderRadius: 25,
  },
  // 핸들 아래는 핸들 자체 여백이 있어 좁게, 좌우·하단은 20으로 통일
  contentContainer: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bottomModalContentTitle: {
    alignItem: "center",
    padding: 10,
  },
  bottomModalCards: {
    flexDirection: "row",
    gap: 12,
  },
  bottomModalCard: {
    flex: 1,
    padding: 20,
    borderRadius: 8,
  },
  bottomModalCardPressed: {
    opacity: 0.7,
  },
  bottomModalContentTitleText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  bottomModalDescText: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  resultBtn: {
    marginTop: 20,
    marginHorizontal: 20,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#2165A6",
    alignItems: "center",
    justifyContent: "center",
  },
  resultBtnPressed: {
    opacity: 0.8,
  },
  resultBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8EFF7",
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  tagText: {
    fontSize: 13,
    color: "#2165A6",
  },
  tagRemove: {
    fontSize: 11,
    color: "#2165A6",
  },
  contentBottom: {
    backgroundColor: "#fff",
    paddingBottom: 10, // 하단 안전 여백 추가
  },
});
