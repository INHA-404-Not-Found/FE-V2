import { useNavigation } from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import api from "../api/api";
import { getMyPosts, removePost } from "../api/post";
import DefaultHeader from "../components/DefaultHeader";
import MyPostListItem from "../components/MyPostListItem";
import PostTypeSelector from "../components/PostTypeSelector";

const MyPostListScreen = () => {
  const myInfo = useSelector((state) => state.my.info);
  const [posts, setPosts] = useState([]);
  const [pageNo, setPageNo] = useState(1);
  const [delVisible, setDelVisible] = useState(false);
  const [delVisible2, setChangeStateVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null); // 드롭다운 메뉴 위치 (null이면 닫힘)
  const [postType, setPostType] = useState("ALL"); // ALL FIND LOST
  const [state, setState] = useState(""); // "" UNCOMPLETED COMPLETED POLICE
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);

  const rootRef = useRef(null);
  const needsRefreshRef = useRef(false);
  const navigation = useNavigation();

  // ... 버튼 바로 아래(공간이 부족하면 위)에 메뉴를 띄움
  const handleMenuPress = useCallback((post, anchor) => {
    rootRef.current?.measureInWindow((rootX, rootY, rootWidth, rootHeight) => {
      const anchorTop = anchor.y - rootY;
      const anchorBottom = anchorTop + anchor.height;
      const right = rootWidth - (anchor.x - rootX + anchor.width);
      const openUpward = anchorBottom + MENU_MAX_HEIGHT > rootHeight;

      setSelectedPostId(post.postId);
      setSelectedPost(post);
      setMenuPosition(
        openUpward
          ? { right, bottom: rootHeight - anchorTop }
          : { right, top: anchorBottom },
      );
    });
  }, []);

  const closeMenu = () => setMenuPosition(null);

  // 게시글 수정 화면에서 돌아오면 목록 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!needsRefreshRef.current) return;
      needsRefreshRef.current = false;
      getMyPosts(setPosts, 1); // 1페이지부터 다시 불러오기
      setPageNo(1);
    });
    return unsubscribe;
  }, [navigation]);

  const canModify =
    selectedPost?.status !== "COMPLETED" && selectedPost?.status !== "POLICE";

  const closeModal = () => setDelVisible(false);
  const closeModal2 = () => setChangeStateVisible(false);

  useEffect(() => {
    if (pageNo > 1 && !hasNext) return;
    (async () => {
      setLoading(true);
      try {
        await getMyPosts(setPosts, pageNo);
      } catch (e) {
        console.error("게시글 목록 조회 오류:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [pageNo]);

  const onEndReached = () => {
    if (loading || !hasNext) return; // 중복/무한루프 방지
    setPageNo((p) => p + 1);
  };

  const handleState = (v) => {
    if (state == "") {
      setState(v);
    } else {
      setState(state === v ? "" : v);
    }
  };

  const modifyPost = async () => {
    if (state === "COMPLETED") {
      return;
    }
    try {
      const res = await api.patch(`/posts/${selectedPostId}`, {
        status: "COMPLETED",
      });

      getMyPosts(setPosts, 1); // 1페이지부터 다시 불러오기
      setPageNo(1);
      console.log("게시글 상태 변경 성공:", res.data);
    } catch (e) {
      console.error("에러 발생: ", e);
      alert("게시글 상태 변경 실패");
    }
  };

  const filteredPosts = useMemo(() => {
    return posts
      .filter((p) => (postType === "ALL" ? true : p.type === postType))
      .filter((p) => (state ? p.status === state : true));
  }, [posts, postType, state]);

  return (
    <View ref={rootRef} style={{ flex: 1 }} collapsable={false}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "white" }}
        edge={["top"]}
      >
        <DefaultHeader />
        <View style={styles.listContainer}>
          <PostTypeSelector postType={postType} setPostType={setPostType} />

          <View style={[styles.filterBtnContent]}>
            <Pressable
              onPress={() => handleState("UNCOMPLETED")}
              style={[
                styles.filterBtn,
                {
                  borderColor: state === "UNCOMPLETED" ? "darkGray" : "#a8a8a8",
                  backgroundColor:
                    state === "UNCOMPLETED" ? "#d9d9d9" : "rgba(0,0,0,0)",
                },
              ]}
            >
              <Text
                style={[
                  styles.BtnText,
                  {
                    color: state === "UNCOMPLETED" ? "darkGray" : "#a8a8a8",
                  },
                ]}
              >
                미완료
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleState("COMPLETED")}
              style={[
                styles.filterBtn,
                {
                  borderColor: state === "COMPLETED" ? "darkGray" : "#a8a8a8",
                  backgroundColor: state === "COMPLETED" ? "#d9d9d9" : "white",
                },
              ]}
            >
              <Text
                style={[
                  styles.BtnText,
                  {
                    color: state === "COMPLETED" ? "darkGray" : "#a8a8a8",
                  },
                ]}
              >
                완료
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleState("POLICE")}
              style={[
                styles.filterBtn,
                {
                  borderColor: state === "POLICE" ? "darkGray" : "#a8a8a8",
                  backgroundColor: state === "POLICE" ? "#d9d9d9" : "white",
                },
              ]}
            >
              <Text
                style={[
                  styles.BtnText,
                  {
                    color: state === "POLICE" ? "darkGray" : "#a8a8a8",
                  },
                ]}
              >
                인계됨
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.postId.toString()}
            renderItem={({ item }) => (
              <MyPostListItem
                post={item}
                menuOpen={!!menuPosition && selectedPostId === item.postId}
                handleMenuPress={(anchor) => handleMenuPress(item, anchor)}
              />
            )}
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 2 }}
          />

          <Modal
            visible={delVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDelVisible(false)}
          >
            <TouchableWithoutFeedback onPress={closeModal}>
              <View style={styles.overlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalTitleText}>
                      게시글을 삭제하시겠어요?
                    </Text>
                    <Text style={styles.modalContentText}>
                      삭제한 게시글은 복구할 수 없습니다.
                    </Text>
                    <View style={styles.modalBtnContainer}>
                      <Pressable
                        onPress={closeModal}
                        style={styles.modalCancelBtn}
                      >
                        <Text style={styles.modalBtnText}>취소</Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          await removePost(selectedPostId);
                          closeModal();
                          setPosts((prev) =>
                            prev.filter((p) => p.postId !== selectedPostId),
                          );
                        }}
                        style={styles.modalSubmitBtn}
                      >
                        <Text style={styles.modalBtnWhiteText}>삭제</Text>
                      </Pressable>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          <Modal
            visible={delVisible2}
            transparent
            animationType="fade"
            onRequestClose={() => setChangeStateVisible(false)}
          >
            <TouchableWithoutFeedback onPress={closeModal2}>
              <View style={styles.overlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalTitleText}>
                      게시글을 완료 처리하시겠어요?
                    </Text>
                    <Text style={styles.modalContentText}>
                      완료된 게시글은 이후에{"\n"}수정하거나 되돌릴 수 없습니다.
                    </Text>
                    <View style={styles.modalBtnContainer}>
                      <Pressable
                        onPress={closeModal2}
                        style={styles.modalCancelBtn}
                      >
                        <Text style={styles.modalBtnText}>취소</Text>
                      </Pressable>

                      <Pressable
                        onPress={async () => {
                          console.log("상태 완료로 변경");
                          await modifyPost();
                          closeModal2();
                        }}
                        style={styles.modalSubmitBtn}
                      >
                        <Text style={styles.modalBtnWhiteText}>변경</Text>
                      </Pressable>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </SafeAreaView>

      {menuPosition && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
          <View style={[styles.dropdownMenu, menuPosition]}>
            {canModify && (
              <Pressable
                style={({ pressed }) => [
                  styles.dropdownItem,
                  pressed && styles.dropdownItemPressed,
                ]}
                onPress={() => {
                  closeMenu();
                  needsRefreshRef.current = true;
                  navigation.navigate("EditPostScreen", {
                    postId: selectedPostId,
                  });
                }}
              >
                <Text style={styles.dropdownItemText}>게시글 수정</Text>
              </Pressable>
            )}
            {canModify && (
              <Pressable
                style={({ pressed }) => [
                  styles.dropdownItem,
                  pressed && styles.dropdownItemPressed,
                ]}
                onPress={() => {
                  closeMenu();
                  setChangeStateVisible(true);
                }}
              >
                <Text style={styles.dropdownItemText}>상태 변경</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.dropdownItem,
                pressed && styles.dropdownItemPressed,
              ]}
              onPress={() => {
                closeMenu();
                setDelVisible(true);
              }}
            >
              <Text style={[styles.dropdownItemText, { color: "#DC2626" }]}>
                삭제하기
              </Text>
            </Pressable>
          </View>
        </Pressable>
      )}
    </View>
  );
};

export default MyPostListScreen;

const MENU_MAX_HEIGHT = 140; // 메뉴 항목 3개 기준 대략적인 높이

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 15,
    flex: 1,
  },
  filterResetBtn: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    padding: 4,
  },
  resetImg: {
    width: 15,
    height: 15,
  },
  filterDownBtn: {
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "#dbdbdb",
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    paddingLeft: 13,
    marginRight: 8,
  },
  filterBtn: {
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "#dbdbdb",
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 13,
    marginRight: 8,
  },
  filterDownImg: {
    width: 20,
    height: 26,
    marginLeft: 4,
  },
  filterBtnContainer: {
    paddingVertical: 8,
    flexGrow: 0,
  },
  filterBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  dropdownMenu: {
    position: "absolute",
    minWidth: 120,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownItemPressed: {
    backgroundColor: "#f2f6ff",
  },
  dropdownItemText: {
    fontSize: 14,
  },
  bottomModalContentTitle: {
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
    alignItems: "center",
    padding: 10,
  },
  bottomModalContentTitleText: {
    fontSize: 18,
    fontWeight: 600,
  },
  bottomModalResetBtn: {
    borderRadius: 10,
    backgroundColor: "#e9e9e9",
    padding: 10,
    flex: 2,
    alignItems: "center",
  },
  bottomModalSubmitBtn: {
    borderRadius: 10,
    backgroundColor: "#2165A6",
    padding: 10,
    flex: 8,
    alignItems: "center",
  },
  bottomModalBtnContainer: {
    flexDirection: "row",
    gap: 14,
  },
  submitBtnText: {
    color: "white",
  },
  locationSelectMask: {
    width: 380,
    height: 230,
    marginVertical: 15,
  },
  locationMapImg: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "white",
    paddingVertical: 25,
    paddingHorizontal: 45,
    borderRadius: 25,
  },
  modalCancelBtn: {
    borderRadius: 10,
    backgroundColor: "#e9e9e9",
    padding: 8,
    alignItems: "center",
    flex: 1,
  },
  modalSubmitBtn: {
    borderRadius: 10,
    backgroundColor: "#2165A6",
    padding: 8,
    alignItems: "center",
    flex: 1,
  },
  modalBtnText: {
    fontSize: 16,
  },
  modalBtnWhiteText: {
    fontSize: 16,
    color: "white",
  },
  modalBtnContainer: {
    flexDirection: "row",
    gap: 10,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: 600,
  },
  modalContentText: {
    paddingVertical: 23,
    fontSize: 13,
  },
});
