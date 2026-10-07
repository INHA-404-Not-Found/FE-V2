import { useNavigation } from "@react-navigation/native";
import React, { useRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { DateFormat } from "../utils/DateFormat";
import { toImageSource } from "../utils/imageSource";

const MyPostListItem = ({ post, handleMenuPress, menuOpen }) => {
  const navigation = useNavigation();
  const imageSource = toImageSource(post?.imagePath);
  const menuBtnRef = useRef(null);

  // ... 버튼의 화면상 위치를 측정해서 그 아래에 메뉴를 띄울 수 있도록 전달
  const onMenuPress = () => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      handleMenuPress({ x, y, width, height });
    });
  };

  return (
    <Pressable onPress={() => navigation.navigate("PostScreen", post.postId)}>
      <View
        style={[styles.postContainer, menuOpen && styles.postContainerActive]}
      >
        <View style={styles.postImgWrapper}>
          <Image source={imageSource} style={styles.postImg}></Image>
        </View>
        <View style={{ paddingHorizontal: 20, flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.postType}>({post.type === "FIND" ? "습득" : "분실"})</Text>
            <Text
              style={styles.postTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {post.title}
            </Text>

            <View
              style={[
                styles.postState,
                post.status === "COMPLETED" && { borderColor: "#2563EB" },
                post.status === "POLICE" && { borderColor: "#A10CF2" },
                { marginLeft: 5 }, // 제목과 상태 표시 사이 간격
              ]}
            >
              {post.status === "UNCOMPLETED" && <Text style={styles.postStateText}>미완료</Text>}
              {post.status === "COMPLETED" && <Text style={[styles.postStateText, { color: "#2563EB" }]}>완료</Text>}
              {post.status === "POLICE" && <Text style={[styles.postStateText, { color: "#A10CF2" }]}>인계됨</Text>}
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 4,
            }}
          >
            {
              post.locationName && 
                  <Text style={styles.LocationText}>
                  {post.locationName} {post.locationDetail}
                </Text>
              }
              <Text style={styles.LocationText}>{DateFormat(post.createdAt)}</Text>
            </View>
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={styles.postContent}
          >
            {post.content}
          </Text>
        </View>
        <Pressable
          ref={menuBtnRef}
          onPress={onMenuPress}
          style={styles.postMenuBtn}
          hitSlop={8}
        >
          <Image
            source={require("../assets/postMenu.png")}
            style={styles.postMenuImg}
          ></Image>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default MyPostListItem;

const styles = StyleSheet.create({
  postContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEAEA",
    paddingVertical: 13,
  },
  postContainerActive: {
    backgroundColor: "#F2F6FF",
  },
  postImgWrapper: {
    width: 90,
    height: 90,
    overflow: "hidden",
  },
  postImgWrapper: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#DADEE7",
    borderWidth: 1.5,
    borderColor: "#DADEE7",
    justifyContent: "center",
    alignItems: "center",

    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  postImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  postType: {
    color: "gray",
  },
  postTitle: {
    fontSize: 14,
    flexShrink: 1, 
    minWidth: 50,
  },
  LocationText: {
    fontSize: 10,
    fontWeight: "light",
    color: "#a8a8a8",
    marginRight: 10,
  },
  postContent: {
    fontSize: 10,
    fontWeight: "light",
  },
  postState: {
    borderRadius: 15,
    width: 46,
    height: 20,
    borderWidth: 1,
    borderColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  postStateText: {
    fontSize: 10,
    color: "#EA580C",
  },
  postMenuBtn: {
    alignItems: "center",
    width: 30,
    height: 30,
  },
  postMenuImg: {
    width: 20,
    height: 20,
  },
});
