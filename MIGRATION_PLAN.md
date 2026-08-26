# Expo → Bare React Native 전환 + FCM 푸시 알림

## Context

**왜 이 작업을 하는가.** LOST INHA 앱(인하대 분실물 앱)에 푸시 알림을 넣으려다 막혔다. `expo-notifications`로 시도했으나 Expo SDK 53부터 Expo Go 앱에서 원격 푸시가 제거되어 테스트 자체가 불가능했고, 팀원이 dev build로도 시도했으나 역시 막혔다고 한다. 그래서 bare React Native로 전환하기로 결정했다.

**조사 결과 — 막힌 진짜 원인은 Expo가 아니었을 가능성이 높다.** 코드에서 확인된 것:

- `App.js`의 푸시 등록 코드가 `getExpoPushTokenAsync({ projectId: "com.anonymous.next_campus" })`를 호출한다. `projectId`에는 EAS 프로젝트 UUID가 들어가야 하는데 패키지명이 들어가 있다 → 토큰 발급이 애초에 실패하는 코드다.
- `app.json:34-36`에 `"android": { "permissions": ["NOTIFICATIONS"] }` 블록이 `android` 안에 **중첩**되어 있다(오타). 이 위치에서는 무시되므로 권한이 매니페스트에 들어간 적이 없다. 게다가 Android 13+의 실제 권한 문자열은 `POST_NOTIFICATIONS`다.
- `eas.json` 없음, `extra.eas.projectId` 없음 → EAS 프로젝트가 연결된 적이 없다.
- `ios.bundleIdentifier`가 어디에도 없다.

즉 Expo를 벗어나도 이 설정 실수들을 그대로 가져가면 알림은 여전히 안 온다. 이 계획은 전환과 **함께 위 버그들을 모두 잡는 것**을 전제로 한다.

**목표 결과물:** 프로젝트가 소유하는 `android/` 네이티브 폴더 위에서 빌드되고, FCM 푸시가 foreground/background/종료 상태 모두에서 동작하는 앱.

**이번 범위 (사용자 확인 완료):**
- **Android 우선.** iOS는 이번 범위 밖 (Mac + Apple 개발자 계정 + APNs 키 필요).
- **Firebase 프로젝트는 이미 존재.** 기존 프로젝트에 Android 앱만 등록해서 `google-services.json`을 받는다.
- **백엔드 발송 방식은 확인 필요** — 아래 "백엔드 협의" 항목 참조. 이건 프론트에서 해결 불가능한 블로커다.

---

## 전환 방식: `expo prebuild` + expo-* 패키지 유지

세 가지 경로를 비교했다:

| 경로 | expo-* 4개 패키지 | 작업량 | 리스크 |
|---|---|---|---|
| **(c) prebuild + expo-* 유지** ← 추천 | 그대로 사용, 코드 수정 0 | 낮음 | 낮음 |
| (a) prebuild 후 Expo 런타임 제거 | 전부 교체 필요 | 높음 | 높음 (생성된 네이티브 프로젝트 수작업 편집) |
| (b) RN CLI로 새 프로젝트 만들고 이식 | 전부 교체 필요 | 높음 | 가장 높음 |

**(c)를 추천하는 이유.** `npx expo prebuild`는 `android/` 폴더를 실제로 생성해서 프로젝트가 소유하게 만든다. 이 시점부터 `npx react-native run-android`로 빌드되고, Expo Go도 EAS도 필요 없다 — 원하던 "bare React Native"가 바로 이것이다. 차이는 `expo-modules-core`가 남아 autolinking을 처리해준다는 것뿐이고, 그 덕분에 이미 쓰고 있는 4개 패키지를 건드릴 필요가 없다.

실제 Expo 의존 범위는 좁다 — **4개 패키지, 8개 파일**:
- `expo-secure-store` → `tokenStorage.js` (토큰 저장), `components/Notification.js` (dead import, 실제 호출 없음)
- `expo-image-picker` + `expo-image-manipulator` → `screens/AddPostScreen.js`, `AddLostPostScreen.js`, `EditPostScreen.js`
- `expo-checkbox` → `components/CategoryList.js`

이들은 Expo Go와 무관한 일반 네이티브 모듈이라 prebuild 후에도 정상 동작한다. 반면 (b)를 택하면 푸시 알림을 새로 붙이는 것과 **동시에** 이미지 피커 결과 shape 변경(`canceled`→`didCancel`, `mimeType`→`type`), SecureStore 비동기 전환 등을 한꺼번에 처리해야 해서 무엇이 깨졌는지 분간이 안 된다.

`expo-*` 완전 제거를 원한다면 푸시가 안정화된 후 파일 1~3개씩 개별 교체하면 된다 (마지막 "선택적 후속 작업" 참조).

---

## 사전 정리 (전환 전에 고쳐야 할 것)

`npm install`부터 필요하다 — **현재 `node_modules`가 아예 없다.**

**1. 미선언 의존성 추가 (`package.json`)**

`react-native-gesture-handler`와 `react-native-reanimated`가 5개 파일에서 직접 import되는데 `package.json`에 선언이 없다. `@gorhom/bottom-sheet`의 peer dependency로만 딸려 들어오고 있어서, lockfile을 다시 만들면 사라진다. lockfile에 고정된 버전으로 명시적 추가:
- `react-native-gesture-handler@2.29.1`
- `react-native-reanimated@4.1.3`

사용처: `App.js:8`, `components/LocationMap.js:7,11`, `components/LocationViewBox.js:7,8`, `screens/MyPostListScreen.js:23`, `screens/PostListScreen.js:23`

**2. New Architecture 확인 (필수)**

Reanimated 4.x는 New Architecture를 **요구**한다 (레거시 아키텍처 지원 중단). prebuild 후 `android/gradle.properties`에 `newArchEnabled=true`인지 반드시 확인. `false`면 `LocationMap`/`LocationViewBox`가 마운트되는 순간 크래시한다.

**3. `App.js` 부트 경로 버그**

`App.js:196-205`가 `tokenStorage.getAccessTStorage()`와 `TokenStore.setToken()`을 호출하는데 **둘 다 import되어 있지 않다** → 앱 시작 시 `ReferenceError`. 전환과 무관한 기존 버그지만 부트 경로라 같이 고친다.

**4. `App.js` StatusBar**

`App.js:1,210`이 `react-native`의 `StatusBar`에 `style="dark-content"`를 넘긴다. RN의 prop 이름은 `barStyle`이라 현재 무효다. `barStyle="dark-content"`로 수정.

---

## `app.json` 수정 (prebuild 전에 반드시)

prebuild는 `app.json`을 읽어 네이티브 프로젝트를 생성하므로, **여기가 틀리면 생성된 결과물도 틀린다.**

- **`android.android.permissions` 중첩 오타 제거** (`app.json:34-36`) → 최상위 `android.permissions`로 옮기고 값을 `"POST_NOTIFICATIONS"`로 수정
- **`android.package` 변경 검토** — 현재 `com.anonymous.next_campus`. `anonymous`는 Expo 기본 placeholder다. **지금 정해야 한다**: 나중에 바꾸면 Firebase 앱 재등록 + `google-services.json` 재발급 + 기존 토큰 전부 무효화된다. 예: `kr.ac.inha.lostinha`
- **`plugins`에서 `expo-notifications` 제거** — RNFB로 대체
- **`plugins`에 `@react-native-firebase/app` 추가** — Gradle 설정을 자동 처리 (네이티브 파일 수작업 편집 회피)
- **`android.adaptiveIcon.foregroundImage`** → `./assets/adaptive-icon.png` (현재 `icon.png`를 가리키는데, 전용 파일이 이미 `assets/`에 있다)
- **`ios.bundleIdentifier` 추가** — 이번엔 Android만 하더라도, prebuild가 요구하므로 미리 정해둔다

**`.gitignore` 수정 필수:** 현재 `/android`와 `/ios`가 "generated native folders"로 무시되고 있다. bare RN에서는 네이티브 폴더를 **버전 관리에 포함**해야 하므로 이 두 줄을 제거한다.

---

## FCM 푸시 구현

**라이브러리:** `@react-native-firebase/app` + `@react-native-firebase/messaging`

**Android 알림 채널이 필수다.** RNFB messaging 단독으로는 채널을 만들지 않고, Android 8(API 26)+ 는 채널 없이는 알림을 **하나도** 표시하지 않는다. 토큰이 정상이고 백엔드 발송이 성공해도 조용히 아무 일도 안 일어난다. `notifee`를 함께 넣어 채널 생성 + foreground 표시를 처리하는 것을 권장한다.

**`App.js`의 주석 처리된 두 블록을 RNFB API로 교체** (`App.js:22-93`, `App.js:163-195`):

```js
import messaging from '@react-native-firebase/messaging';

async function registerForPushNotification() {
  const authStatus = await messaging().requestPermission(); // Android 13 POST_NOTIFICATIONS도 처리
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) return null;
  return messaging().getToken(); // FCM 토큰 (Expo 푸시 토큰과 다름)
}
```

기존 `sendTokenToServer()`의 `POST /fcm/token` 호출은 그대로 재사용 가능하다 (저장만 하는 엔드포인트). `messaging().onTokenRefresh(sendTokenToServer)`도 등록해서 토큰 갱신을 반영한다.

**리스너 등록:**
- `messaging().onMessage()` — foreground (직접 표시 필요)
- `messaging().setBackgroundMessageHandler()` — **컴포넌트 밖, `index.js` 최상단에 등록해야 한다** (RNFB 요구사항)
- `messaging().onNotificationOpenedApp()` + `getInitialNotification()` — 알림 탭 처리

탭 시 이동 로직은 `components/Notification.js`의 기존 `onPress`가 하는 것과 동일하게 맞춘다 (`navigation.navigate("PostScreen", postId)`) — 앱 내 알림 목록 탭과 OS 푸시 탭의 동작이 일치하도록.

**Firebase 설정:** 기존 Firebase 프로젝트에 Android 앱을 등록(패키지명은 최종 결정된 `android.package`와 정확히 일치해야 함)하고 `google-services.json`을 받아 `android/app/google-services.json`에 배치.

**참고:** `package.json`의 `firebase` (웹 JS SDK, 12.5.0)는 소스 어디에서도 import되지 않는 미사용 의존성이다. RNFB와 역할이 겹치므로 제거를 검토한다.

---

## 백엔드 협의 (프론트에서 해결 불가 — 반드시 확인)

**FCM 토큰은 Expo 푸시 토큰과 다르고, 발송 경로도 완전히 다르다.**

기존에 백엔드가 Expo Push API(`exp.host/--/api/v2/push/send`)로 보내도록 되어 있다면, 이제는 **Firebase Admin SDK / FCM HTTP v1**로 직접 보내야 한다. 인증 방식, 페이로드 형식, 엔드포인트가 전부 다르다.

**이게 정리되지 않으면 프론트가 100% 정확해도 실제 알림은 영원히 안 온다.** 프론트 작업과 병렬로 백엔드 담당자에게 지금 확인할 것:
1. 현재 `/fcm/token`에 저장된 토큰을 무엇으로 발송하고 있는가?
2. 발송 로직이 이미 FCM Admin SDK 기반인가, Expo Push API 기반인가?

(엔드포인트 이름이 `/fcm/token`인 걸 보면 이미 FCM 기반일 가능성도 있다 — 확인 필요.)

---

## 빌드 설정

route (c)에서는 대부분 변경이 **불필요**하다:

- **`babel.config.js`** — `babel-preset-expo` 유지 가능 (내부적으로 `@react-native/babel-preset`을 감싸고 reanimated 플러그인도 포함). 변경 없음.
- **`tsconfig.json`** — `expo/tsconfig.base` 유지 가능. 변경 없음.
- **`package.json` `main`** — `node_modules/expo/AppEntry.js` 유지 가능. 단, `setBackgroundMessageHandler`를 최상단에 등록할 자체 `index.js`가 필요하므로 이 경우 `index.js`를 만들고 `main`을 변경한다.
- **`metro.config.js`** — 없음. 필요 시 `npx expo customize metro.config.js`로 생성.
- **환경변수** — `api/api.js:5`의 `process.env.EXPO_PUBLIC_API_BASE_URL`은 Expo metro config가 유지되므로 **그대로 동작한다**. 코드 변경 불필요.

**확인 필요:** `.env`는 `https://be-v2.onrender.com`을 가리키는데 `setupProxy.js`는 `https://lost-inha.kro.kr`을 가리킨다. `setupProxy.js`는 CRA 웹 개발용 잔재로 RN 런타임과 무관해 보이므로 삭제 대상이지만, **어느 쪽이 현재 실제 백엔드인지 확인 후** 진행한다.

---

## 실행 순서

각 단계마다 검증 가능하도록 나눴다.

1. **베이스라인 확보** — `npm install` 후 현재 Expo 상태로 앱이 뜨는지 확인. 되돌아갈 기준점.
2. **사전 정리** — 미선언 의존성 추가, `App.js` import 버그 + StatusBar prop 수정.
3. **`app.json` 수정** — 권한 오타, 패키지명, plugins, adaptiveIcon, bundleIdentifier. `.gitignore`에서 `/android`, `/ios` 제거.
4. **`npx expo prebuild --clean`** — `android/` 생성. `gradle.properties`의 `newArchEnabled=true` 확인. 네이티브 폴더 커밋.
5. **푸시 없이 빌드 검증** — `npx react-native run-android`로 기존 기능이 그대로 동작하는지 확인. **여기가 전환이 안전했는지 판단하는 체크포인트다.**
6. **Firebase Android 앱 등록** → `google-services.json` 배치 → 재빌드.
7. **푸시 코드 구현** — RNFB 리스너, 채널 생성, `/fcm/token` 연동.
8. **백엔드 협의 결과 반영** 후 end-to-end 테스트.

---

## 검증

**빌드:** `npx react-native run-android`가 에러 없이 완료되고 `MainScreen`까지 진입.

**푸시 3가지 상태 (Firebase Console → Cloud Messaging 테스트 메시지):**
- Foreground: 앱을 열어둔 채 → `onMessage` 발화 확인
- Background: 앱을 백그라운드로 → 트레이 알림 표시 (채널 없으면 여기서 실패)
- 종료 상태: 강제 종료 후 → 트레이 알림 + 탭 시 올바른 화면 진입 (`getInitialNotification`)
- 토큰 왕복: `getToken()` 값이 서버에 저장된 값과 일치하는지

**기존 기능 회귀 테스트** (파일별로 분리되어 있어 실패 지점 특정이 쉽다):
- 이미지 선택 + 압축 + 업로드 → `AddPostScreen.js`, `AddLostPostScreen.js`, `EditPostScreen.js`
- 토큰 보관 → 로그인 후 강제 종료 → 재실행 시 재로그인 없이 세션 복원 (`tokenStorage.js`)
- **지도 pan/zoom → `components/LocationMap.js`, `LocationViewBox.js`** — Reanimated/New Arch에 가장 민감한 지점이다. 네이티브 쪽이 의심되면 **여기부터** 테스트.

---

## 리스크 / 예상 공수

**공수:** Android만 기준 1.5~2.5일. prebuild + 네이티브 설정 ~0.5일, RNFB 푸시 + 채널 + 테스트 ~1~1.5일, 회귀 테스트 ~0.5일. (iOS 추가 시 +0.5~1일, Apple 개발자 계정 보유 전제)

**전환 후에도 푸시를 막을 수 있는 것들 — 애초에 Expo 탓이 아니었던 것들:**
- `google-services.json` 누락/불일치 — Android "토큰이 안 나온다"의 최다 원인. `build.gradle`의 패키지명과 정확히 일치해야 한다.
- **알림 채널 미생성** — 토큰도 정상, 백엔드 발송도 성공인데 Android 8+ 에서 아무것도 안 보인다. 에러도 안 난다.
- **백엔드가 여전히 Expo Push API로 발송** — 프론트만 고쳐서는 절대 해결 안 됨.
- `POST_NOTIFICATIONS` 권한 누락 — `app.json` 오타를 그대로 가져가면 Android 13+ 에서 조용히 전부 드롭.
- 패키지명 불일치 — Firebase 등록 패키지명과 실제 빌드가 다르면 토큰은 발급되지만 메시지가 라우팅되지 않는다.

---

## 선택적 후속 작업 (푸시 안정화 후)

`expo-*` 의존성 완전 제거를 원할 경우, 파일 단위로 하나씩 교체한다 (각각 독립 검증 가능):

| 패키지 | 대체제 | 주의점 |
|---|---|---|
| `expo-checkbox` | `@react-native-community/checkbox` | 파일 1개, prop 거의 호환. 가장 쉬움 |
| `expo-image-manipulator` | `@bam.tech/react-native-image-resizer` | `createResizedImage`는 width/height 필수 — 현재 코드는 압축만 하고 리사이즈는 `[]`(no-op)라 최대 크기를 새로 정해야 함 |
| `expo-image-picker` | `react-native-image-picker` | 결과 shape 차이: `canceled`→`didCancel`, `mimeType`→`type`, `mediaTypes:["images"]`→`mediaType:'photo'`, `allowsMultipleSelection`→`selectionLimit`. `requestMediaLibraryPermissionsAsync()`에 직접 대응물 없음 (`react-native-permissions` 필요) |
| `expo-secure-store` | `react-native-keychain` | `tokenStorage.js`는 이미 async라 매핑 쉬움. `components/Notification.js`의 동기 `getItem` import는 실제 호출이 없는 dead import로 보이므로 삭제만 하면 될 가능성이 높다 — 확인 후 처리 |

---

# 진행 상황 (2026-08-26 갱신)

## 완료

### 1~3단계 — 커밋 `ac83ea2`, 브랜치 `feat/bare-rn-fcm-migration`
- App.js 부트 버그(import 누락) + StatusBar prop 수정
- app.json 권한 오타 수정, 패키지명 `kr.ac.inha.lostinha` 확정, adaptiveIcon 정정
- package.json에 gesture-handler / reanimated 명시
- .gitignore에서 /android, /ios 해제

### FCM 코드 구현 (2026-08-26)
- **의존성 정리** — 미사용 `firebase`(웹 SDK), `expo-device`, `expo-notifications`,
  `expo-status-bar` 제거. `@react-native-firebase/app`, `@react-native-firebase/messaging`
  (둘 다 23.8.8 — RN 0.81 / Expo SDK 54와 같은 세대), `@notifee/react-native` 9.1.8,
  `react-native-worklets` 0.5.2 추가.
  - RNFB 최신은 26.x지만 RN 0.82+ 세대라 **일부러 23 라인으로 고정**했다.
  - `react-native-worklets`는 Reanimated 4의 필수 peer인데 선언이 없었다
    (gesture-handler / reanimated와 같은 케이스).
- **`index.js` 신설** + `package.json`의 `main`을 `index.js`로 변경.
  RNFB는 `setBackgroundMessageHandler`를 컴포넌트 밖 진입점 최상단에서 등록하도록 요구한다.
- **`notifications.js` 신설** — 채널 생성, 권한 요청, 토큰 발급/전송/갱신,
  foreground 표시, 알림 탭 처리.
- **`navigationRef.js` 신설** — 알림 탭 시 컴포넌트 밖에서 화면 이동.
  콜드 스타트로 NavigationContainer가 아직 없으면 보관했다가 onReady에 실행한다.
- **`App.js`** — 주석 처리돼 있던 expo-notifications 블록 2개를 RNFB 배선으로 교체.
  부트 순서: 로그인 토큰 복원 → 채널 생성 → 권한 요청 → FCM 토큰 등록 → 초기 알림 처리.
- **`hooks/useAuth.js`** — 로그인 성공 직후에도 FCM 토큰을 등록한다
  (앱 시작 시엔 아직 로그인 전일 수 있어서 `/fcm/token`이 401로 떨어진다).
- **`components/Notification.js`** — 호출된 적 없는 `expo-secure-store` import 제거.
- **`app.json`** — `plugins`에 `@react-native-firebase/app` 추가,
  `android.googleServicesFile` 지정.
  notifee는 config plugin이 없고 autolinking으로 붙으므로 `plugins`에 넣지 않는다.

## 다음 할 일

1. **Firebase 콘솔에서 Android 앱 등록** — 패키지명 `kr.ac.inha.lostinha` 와 **정확히** 일치해야 한다.
   `google-services.json` 을 받아 **프로젝트 루트**에 둔다 (`app.json`의
   `android.googleServicesFile`이 이 경로를 보고 prebuild가 `android/app/`으로 복사한다).
   - 이 파일이 없으면 `npx expo prebuild` 가 실패한다. **여기가 지금 막힌 지점이다.**
2. `npx expo prebuild --clean` — `android/` 생성.
3. `android/gradle.properties` 에 `newArchEnabled=true` 확인 **(필수)**
   — Reanimated 4는 New Architecture 필수. false면 지도 화면에서 즉시 크래시.
4. `npx react-native run-android` 로 빌드 + 기존 기능 회귀 테스트.
5. Firebase 콘솔 → Cloud Messaging 테스트 메시지로 foreground / background / 종료 상태 3가지 확인.

## 빌드 환경 주의

- **이 WSL 환경에는 JDK도 Android SDK도 없다.** (`java` 명령 없음, `ANDROID_HOME` 없음)
  `react-native run-android` 는 Android Studio가 있는 Windows 쪽에서 돌려야 한다.
- **npm이 /mnt/c 에서 자주 깨진다.** 9p 파일시스템이라 기존 node_modules를 갱신하는
  작업(`npm install <pkg>`, `npm uninstall`)이 EPERM / ENOTEMPTY로 실패한다.
  실제로 두 번 실패했다. **해결법: `rm -rf node_modules` 후 `npm install` 한 번에 새로 깔기.**
  가능하면 Windows 쪽에서 npm을 돌리는 게 낫다.

## 주의사항 (WSL 환경 이슈)

- **줄바꿈(CRLF) 문제**: WSL git에서 보면 손대지 않은 파일 40여 개가 전부 수정된
  것처럼 보인다. 워킹트리는 CRLF, git 인덱스는 LF라서 그렇다. 커밋할 때
  **내가 실제로 고친 파일만 골라서 add** 할 것. 전체 `git add .` 하면 리포 전체가
  줄바꿈 diff로 뒤덮인다. Windows 쪽 git으로 작업하면 이 문제는 안 보인다.
- **git identity**: WSL git에 identity가 없고 `.git/config` 쓰기가 NTFS 권한 문제로
  막힌다. `git -c user.email=... -c user.name=... commit` 으로 우회했다.
  기존 커밋은 `eheka78 <gemddkim22@gmail.com>` 이므로, 그쪽이 본인 계정이면
  이 커밋 author를 amend할 것.

## 확인 필요한 것 (막판 블로커가 될 수 있음)

- **백엔드 발송 방식** — `/fcm/token`에 저장된 토큰을 Expo Push API로 보내는지
  FCM Admin SDK로 보내는지. Expo Push API면 백엔드도 FCM HTTP v1으로 바꿔야 하고,
  안 바꾸면 프론트가 완벽해도 알림이 영원히 안 온다.
- **푸시 payload의 data 필드 이름** — `notifications.js`의 `openNotificationTarget()`은
  `data.postId`, 없으면 `data.link`(앱 내 알림 목록과 같은 방식)를 기대한다.
  백엔드가 실제로 보내는 키에 맞춰 확인할 것.
- **백엔드 주소** — `.env`는 `https://be-v2.onrender.com`, `setupProxy.js`는
  `https://lost-inha.kro.kr`. 어느 쪽이 현재 서버인지 확인.
  (`setupProxy.js`는 CRA 잔재로 RN에서 안 쓰이므로 삭제 대상)
- **`google-services.json` 커밋 여부** — Android에서는 보통 같이 커밋한다(비밀키 아님).
  팀 정책에 따라 결정.
