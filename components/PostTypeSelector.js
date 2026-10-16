import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const POST_TYPES = [
  { id: "ALL", name: "전체" },
  { id: "FIND", name: "습득" },
  { id: "LOST", name: "분실" },
];

const PostTypeSelector = ({ postType, setPostType }) => {
  return (
    <View style={styles.postTypeSelector}>
      {POST_TYPES.map((type) => {
        const active = postType === type.id;
        return (
          <Pressable
            key={type.id}
            style={[styles.postTypeBtn, active && styles.postTypeBtnActive]}
            onPress={() => setPostType(type.id)}
          >
            <Text style={[styles.BtnText, active && styles.BtnTextActive]}>
              {type.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default PostTypeSelector;

const styles = StyleSheet.create({
  postTypeSelector: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 30,
    justifyContent: "space-between",
  },
  // 선택 안 된 탭도 같은 두께의 투명 밑줄을 둬서, 선택이 바뀔 때 글자가 들썩이지 않게 한다
  postTypeBtn: {
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  postTypeBtnActive: {
    borderColor: "#215294",
  },
  BtnText: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: "#9ca3af",
  },
  BtnTextActive: {
    color: "#215294",
    fontWeight: "600",
  },
});
