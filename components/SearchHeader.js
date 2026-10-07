import React from "react";
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { clearKeyword, setKeyword } from "../Redux/slices/keywordSlice";

const SearchHeader = ({ onSubmit, resetPageNo, onFocus }) => {
  const dispatch = useDispatch();
  const keyword = useSelector((s) => s.search.keyword);

  const submit = () => {
    onSubmit();
    resetPageNo();
  };
  return (
    <View>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <View style={styles.headerContainer}>
        {/* 왼쪽 아이콘 */}
        <Pressable onPress={() => dispatch(clearKeyword())}>
          <Image
            source={require("../assets/close.png")}
            style={styles.headerImg}
          />
        </Pressable>

        {/* 가운데 텍스트 */}
        <TextInput
          value={keyword}
          onChangeText={(text) => dispatch(setKeyword(text))}
          onFocus={onFocus}
          onSubmitEditing={submit}
          returnKeyType="search"
          autoFocus={!keyword} // 돋보기 버튼으로 검색창을 열었을 때 바로 입력
          style={styles.searchInput}
        ></TextInput>

        {/* 오른쪽 아이콘 */}
        <Pressable onPress={submit}>
          <Image
            source={require("../assets/search.png")}
            style={styles.headerImg}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default SearchHeader;

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: "space-between",
    flexDirection: "row",
    paddingLeft: 15,
    paddingRight: 7,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.29)",
  },
  headerText: {
    fontSize: 21,
    fontWeight: "700",
    color: "#1C63B7",
  },
  headerImg: {
    width: 25,
    height: 25,
    marginVertical: 20,
    marginHorizontal: 15,
  },
  searchInput: {
    width: 255,
    height: 47,
    borderRadius: 10,
    backgroundColor: "#DADEE7",
    paddingHorizontal: 15,
  },
});
