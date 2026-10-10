import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getPost } from "../api/post";
import DefaultHeader from "../components/DefaultHeader";
import LocationPreview from "../components/LocationPreview";
import StatusLabel from "../components/StatusLabel";
import { DateFormat } from "../utils/DateFormat";
import { toImageUri } from "../utils/imageSource";

const screenWidth = Dimensions.get("window").width;

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const PostScreen = ({ route, navigation }) => {
  // 목록에서 오면 { postId, postIds }, 그 외(알림, 등록 직후 등)는 postId만 넘어온다
  const params = route.params;
  const postId = typeof params === "object" ? params?.postId : params;
  const postIds = typeof params === "object" ? params?.postIds : null;
  const index = postIds ? postIds.indexOf(postId) : -1;
  const prevId = index > 0 ? postIds[index - 1] : null;
  const nextId =
    index >= 0 && index < postIds.length - 1 ? postIds[index + 1] : null;
  // replace로 바꿔서 몇 번을 넘겨도 뒤로가기 한 번이면 목록으로 돌아간다
  const goTo = (id) =>
    navigation.replace("PostScreen", { postId: id, postIds });
  const [post, setPost] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!postId) return;
    getPost(setPost, postId);
  }, [postId]);

  const handleScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={styles.safe} edge={["top"]}>
      <DefaultHeader />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 이미지 슬라이드 */}
        <View style={styles.imageCard}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
          >
            {Array.isArray(post.imagePath) && post.imagePath.length > 0 ? (
              post.imagePath.map((img, index) => {
                const fullUri = toImageUri(img);
                return (
                  <Pressable
                    key={index}
                    onPress={() => {
                      setSelectedImage(fullUri);
                      setModalVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: fullUri }}
                      style={[styles.UploadedImg, { width: screenWidth - 20 }]}
                      resizeMode="cover"
                    />
                  </Pressable>
                );
              })
            ) : (
              <View style={[styles.UploadedImg, styles.noImageBox]}>
                <Text style={styles.noImageText}>이미지가 없습니다</Text>
              </View>
            )}
          </ScrollView>

          {/* 하단 이미지 갯수 표시 */}
          {Array.isArray(post.imagePath) && post.imagePath.length > 1 && (
            <View style={styles.imageCountBox}>
              <Text style={styles.imageCountText}>
                {currentIndex + 1}/{post.imagePath.length}
              </Text>
            </View>
          )}
        </View>

        {/* 사진 크게 보는 화면 */}
        <Modal visible={modalVisible} transparent={true}>
          <View style={styles.modalBackground}>
            {/* 닫기 버튼 */}
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Image
                style={styles.closeButtonImage}
                source={require("../assets/close.png")}
              />
            </Pressable>

            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </Modal>

        {/* 게시물 내용 */}
        <View style={styles.contentCard}>
          <View style={styles.ContentContainer}>
            <View style={styles.headerRow}>
              <View style={{ flexShrink: 1, paddingRight: 8 }}>
                <Text style={styles.categoryText}>
                  {post.categories?.join(", ") || "카테고리 없음"}
                </Text>
                <Text style={styles.titleText}>{post.title}</Text>
                <Text style={styles.dateText}>
                  {DateFormat(post.createdAt)}
                </Text>
              </View>
              <StatusLabel status={post.status} />
            </View>

            {(!!post.locationName ||
              (post.type === "FIND" && !!post.storedLocation)) && (
              <View style={styles.infoBox}>
                {!!post.locationName && (
                  <InfoRow
                    label={post.type === "FIND" ? "습득 장소" : "분실 장소"}
                    value={[post.locationName, post.locationDetail]
                      .filter(Boolean)
                      .join(" ")}
                  />
                )}
                {post.type === "FIND" && !!post.storedLocation && (
                  <InfoRow label="보관 위치" value={post.storedLocation} />
                )}
              </View>
            )}
            {post.type === "FIND" && !!post.locationName && (
              <LocationPreview locationName={post.locationName} />
            )}

            <View style={styles.divider} />

            <Text style={styles.bodyText}>{post.content}</Text>
          </View>
        </View>

        {/* 목록에서 들어온 경우에만 이전/다음 글 이동 (불러온 목록 범위 안에서) */}
        {index >= 0 && (
          <View style={styles.navRow}>
            <Pressable
              onPress={() => goTo(prevId)}
              disabled={!prevId}
              style={[styles.navBtn, !prevId && styles.navBtnDisabled]}
            >
              <Text style={[styles.navText, !prevId && styles.navTextDisabled]}>
                ‹ 이전 글
              </Text>
            </Pressable>
            <Pressable
              onPress={() => goTo(nextId)}
              disabled={!nextId}
              style={[styles.navBtn, !nextId && styles.navBtnDisabled]}
            >
              <Text style={[styles.navText, !nextId && styles.navTextDisabled]}>
                다음 글 ›
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  imageCard: {
    marginHorizontal: 10,
    marginTop: 15,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  UploadedImg: {
    height: 380,
    backgroundColor: "#E5E7EB",
  },
  noImageBox: {
    alignItems: "center",
    justifyContent: "center",
    height: 380,
    width: 400,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noImageText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "500",
  },
  imageCountBox: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  imageCountText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 15,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 8,
  },
  closeButtonImage: {
    width: 24,
    height: 24,
    tintColor: "#000",
  },
  contentCard: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginTop: 15,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  ContentContainer: {},
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 14,
    marginTop: 12,
  },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  navBtnDisabled: {
    backgroundColor: "#F3F4F6",
  },
  navText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#215294",
  },
  navTextDisabled: {
    color: "#C4C4C4",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 13,
    color: "#215294",
    fontWeight: "600",
    marginBottom: 4,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    color: "#111827",
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  infoBox: {
    marginTop: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
  },
  infoLabel: {
    width: 72,
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#374151",
  },
});
