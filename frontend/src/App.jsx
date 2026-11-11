import { CheckoutPage, PaymentPage, PaymentHistory, AdminPayments } from "./payments";
import { LessonExercises } from './lesson-exercises';
import { ReferenceNav as Nav, ReferenceManagement as ManagementLayout } from "./shell";
import { AuthScreen, SurveyWizard, PlacementFlow, AssessmentPage, AssessmentResult } from "./learning-flows";
import { EmotionDiary } from "./emotion";
import { ClassOverview, SessionGroups, SessionReport, StudentList, StudentPage, SessionDirectory } from "./classroom";
import { MediaManager } from "./media";
import { ReferenceLanding, ReferenceDashboard, ReferenceRoadmap, DesignSystem } from "./reference-pages";
import React, { useState, useEffect } from "react";
import { Code2, LayoutDashboard, BookOpen, BarChart3, Users, Bell, LogOut, Menu, X, GraduationCap, FileCode2, Video, Shield, Wallet, Flag, ArrowRight } from "lucide-react";
import { useRoute, useSession } from "./api";
import { Link, Loading, Empty, Button } from "./ui";
import { Landing, Auth, Dashboard, Catalog, CourseDetail, Roadmap, LessonPage, CodePage, Placement, Insight, History, Emotions, Leaderboard, Account, Notifications } from "./pages-learning";
import { ManageHome, Classes, ClassDetail, ContentManager, MediaLibrary, Admin } from "./pages-management";
function Logo() {
  return <Link to="/" className="brand">
      <span>
        <Code2 size={23} />
      </span>
      Smart<span className="brand-code">Code</span>
    </Link>;
}
class ErrorBoundary extends React.Component {
  state = {
    error: false
  };
  static getDerivedStateFromError() {
    return {
      error: true
    };
  }
  render() {
    return this.state.error ? <div className="page-container">
        <Empty title="Trang chưa hiển thị được" action={<Button onClick={() => location.reload()}>Tải lại trang</Button>}>
          Dữ liệu của bạn vẫn được lưu trên máy chủ. Vui lòng tải lại.
        </Empty>
      </div> : this.props.children;
  }
}
export default function App() {
  const route = useRoute(),
    {
      user,
      loading
    } = useSession();
  const [first, second, third, fourth, fifth, sixth] = route.split("?")[0].split("/").filter(Boolean);
  const management = first === "manage" || first === "admin";
  let content;
  if (loading) return <Loading />;
  const publicPage = !first || ["login", "register", "forgot-password", "reset-password", "courses", "design-system"].includes(first);
  if (!user && !publicPage) content = <div className="page-container narrow">
        <Empty title="Đăng nhập để tiếp tục học" action={<Link className="btn primary" to="/login">
              Đăng nhập <ArrowRight size={16} />
            </Link>}>
          Tiến độ, bài làm và ghi chú sẽ được lưu trong tài khoản của bạn.
        </Empty>
      </div>;else if (management && (user?.role === "learner" || first === "admin" && user?.role !== "admin")) content = <div className="page-container">
        <Empty title="Bạn chưa có quyền truy cập" action={<Link to="/dashboard" className="btn primary">
              Về trang học tập
            </Link>} />
      </div>;else if (!first) content = user ? <ReferenceDashboard /> : <ReferenceLanding />;else if (first === "login" || first === "register") content = <AuthScreen key={first} mode={first} />;else if (first === "forgot-password" || first === "reset-password") content = <AuthScreen key={first} mode={first === 'forgot-password' ? 'forgot' : 'reset'} />;else if (first === "design-system") content = <DesignSystem />;else if (first === "survey" && second) content = <SurveyWizard key={second} id={Number(second)} />;else if (first === "assessment" && second) content = <AssessmentPage key={second} id={Number(second)} />;else if (first === "assessment-result" && second) content = <AssessmentResult key={second} id={Number(second)} />;else if (first === "dashboard") content = <ReferenceDashboard />;else if (first === "courses") content = second ? <CourseDetail key={second} id={Number(second)} /> : <Catalog />;else if (first === "checkout" && second) content = <CheckoutPage key={second} id={Number(second)} />;else if (first === "payments") content = second ? <PaymentPage key={second} id={Number(second)} /> : <PaymentHistory />;else if (first === "roadmap" && second) content = <ReferenceRoadmap key={second} id={Number(second)} />;else if (first === "lesson" && second) content = third === "exercises" ? <LessonExercises key={second} id={Number(second)} /> : <LessonPage key={second} id={Number(second)} />;else if (first === "code" && second) content = <CodePage key={second} id={Number(second)} />;else if (first === "placement" && second) content = <PlacementFlow key={second} id={Number(second)} />;else if (first === "insight" || first === "skills") content = <Insight key={first} skillsOnly={first === "skills"} />;else if (first === "history") content = <History />;else if (first === "emotions") content = <EmotionDiary />;else if (first === "leaderboard") content = <Leaderboard />;else if (first === "account") content = <Account />;else if (first === "notifications") content = <Notifications />;else if (first === "classes") content = <Classes />;else if (first === "manage") {
    if (!second) content = <ManageHome />;else if (second === "classes") {
      if (!third) content = <Classes manage />;else if (fourth === 'sessions' && fifth) content = sixth === 'live' || sixth === 'report' ? <SessionReport key={route} classId={Number(third)} id={Number(fifth)} live={sixth === 'live'} /> : <SessionGroups key={route} classId={Number(third)} id={Number(fifth)} />;else if (fourth === 'students') content = fifth ? <StudentPage key={route} classId={Number(third)} id={Number(fifth)} /> : <StudentList classId={Number(third)} />;else content = <ClassOverview key={third} id={Number(third)} />;
    } else if (second === 'live' || second === 'reports') content = <SessionDirectory key={second} reports={second === 'reports'} />;else if (["courses", "lessons", "exercises"].includes(second)) content = <ContentManager key={second} section={second} />;else if (second === "media") content = <MediaManager />;
  } else if (first === "admin" && (!second || ["users", "payments", "reports"].includes(second))) content = second === "payments" ? <AdminPayments /> : <Admin key={second || "overview"} section={second || "overview"} />;
  if (!content) content = <div className="page-container">
        <Empty title="Không tìm thấy trang" action={<Link to="/" className="btn primary">
              Về trang chủ
            </Link>} />
      </div>;
  return <div className="app-shell" data-page={first || 'home'}>
      <Nav route={route} />
      <ErrorBoundary key={route}>
        <div id="main-content">
          {management && user && user.role !== "learner" ? <ManagementLayout route={route}>{content}</ManagementLayout> : content}
        </div>
      </ErrorBoundary>
      {!management && !["login", "register", "forgot-password", "reset-password", "code", "assessment", "survey"].includes(first) && <footer className="footer">
          <Logo />
          <span>Học từng bước. Tiến bộ mỗi ngày.</span>
          <div>
            <Link to="/courses">Khóa học</Link>
            <Link to={user ? "/account" : "/login"}>Tài khoản</Link>
          </div>
        </footer>}
    </div>;
}
