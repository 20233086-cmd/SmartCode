import React, { useState, useEffect } from 'react';
import { Menu, X, Bell, LogOut, LayoutDashboard, Users, Code2, Radio, FileText, BookOpen, Video, Shield, Wallet, Flag, HelpCircle } from 'lucide-react';
import { useSession, useData } from './api';
import { Link, Modal, Button, LogoutButton } from './ui';
export function Brand({
  classroom = false
}) {
  return <Link to={classroom ? '/manage' : '/'} className="reference-brand"><span>&gt;_</span><div><b>{classroom ? 'ClassRoom' : 'SmartCode'}</b><small>{classroom ? 'Giảng viên' : 'Learn Smart, Code Fast'}</small></div></Link>;
}
export function ReferenceNav({
  route
}) {
  const {
    user
  } = useSession();
  const [open, setOpen] = useState(false);
  const c = useData(user ? '/my/courses' : null);
  const a = useData(user ? '/analytics' : null);
  useEffect(() => setOpen(false), [route]);
  const first = route.split('/')[1]?.split('?')[0] || '';
  const course = c.data?.find(x => x.enrolled)?.id;
  const roadmap = course ? '/roadmap/' + course : '/courses';
  if (['login', 'register', 'forgot-password', 'reset-password', 'manage', 'admin'].includes(first)) return null;
  const band = user && ['dashboard', 'roadmap', 'lesson', 'code', 'assessment', 'assessment-result', 'placement', 'skills', 'insight', 'emotions'].includes(first);
  const links = band ? [["/dashboard", "Dashboard"], [roadmap, "Lộ trình"], ["/skills", "Kỹ năng"], ["/insight", "Insight"]] : [["/", "Trang chủ"], ["/skills", "Phân tích"], ["/courses", "Khám phá"], [roadmap, "Học tập cùng AI"], ["/insight", "Thống kê"]];
  return <><header className={band ? 'reference-band' : 'reference-topbar'}><div className="reference-nav-inner">{band ? <Link to="/account" className="band-person"><span className="avatar">{user.name[0]}</span><div><b>Chào bạn, {user.name}</b><small>{first === 'code' ? 'Học, thực hành và theo dõi sự tiến bộ.' : 'Lộ trình được cập nhật từ kết quả học tập.'}</small></div></Link> : <Brand />}<nav className={open ? 'open' : ''}>{band && <><span className="band-pill">HỌC TẬP</span><span className="band-pill">{a.data?.streak || 0} ngày</span></>}{links.map(([url, label]) => <Link key={label} className={route.split('?')[0] === url ? 'active' : ''} to={url}>{label}</Link>)}{open && <><Link to="/classes">Lớp của tôi</Link><Link to="/history">Lịch sử nộp</Link><Link to="/payments">Lịch sử thanh toán</Link><Link to="/notifications">Thông báo</Link><Link to="/account">Tài khoản</Link>{user?.role !== 'learner' && user && <Link to={user.role === 'admin' ? '/admin' : '/manage'}>Quản lý</Link>}{user && <LogoutButton className="small nav-logout-menu" />}</>}</nav><div className="reference-nav-actions">{!band && (user ? <><Link to="/notifications" className="notification-link"><Bell size={17} /><span>Thông báo</span></Link><Link to="/account" className="avatar">{user.name[0]}</Link></> : <Link className="btn primary small" to="/login">Đăng nhập</Link>)}{user && <LogoutButton className="small nav-logout" />}<button className="nav-toggle" aria-label="Mở menu điều hướng" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button></div></div>{band && <h1 className="mobile-page-name">{{
          dashboard: 'Tổng quan',
          roadmap: 'Lộ trình học',
          lesson: 'Video bài giảng',
          insight: 'Insight',
          skills: 'Kỹ năng'
        }[first]}</h1>}</header>{user && <nav className="mobile-bottom-nav"><Link to="/dashboard"><LayoutDashboard size={18} />Tổng quan</Link><Link to={roadmap}><BookOpen size={18} />Lộ trình</Link><Link to="/insight"><Radio size={18} />Insight</Link><Link to="/account"><Users size={18} />Tài khoản</Link></nav>}</>;
}
export function ReferenceManagement({
  route,
  children
}) {
  const {
    user,
    logout,
    isLoggingOut
  } = useSession();
  const [open, setOpen] = useState(false),
    [help, setHelp] = useState(false);
  useEffect(() => setOpen(false), [route]);
  const isAdmin = route.startsWith('/admin');
  const teacher = [[LayoutDashboard, 'Tổng quan', '/manage'], [Users, 'Lớp học', '/manage/classes'], [Code2, 'Ngân hàng bài tập', '/manage/exercises'], [Radio, 'Buổi học trực tiếp', '/manage/live'], [FileText, 'Báo cáo lớp', '/manage/reports'], [BookOpen, 'Bài học & video', '/manage/lessons'], [Video, 'Video bài giảng', '/manage/media'], [BookOpen, 'Khóa học', '/manage/courses']];
  const admin = [[LayoutDashboard, 'Tổng quan', '/admin'], [Users, 'Người dùng', '/admin/users'], [BookOpen, 'Khóa học', '/manage/courses'], [Wallet, 'Giao dịch', '/admin/payments'], [Flag, 'Phản ánh nội dung', '/admin/reports']];
  return <div className={'reference-management ' + (open ? 'menu-open' : '')}><aside><Brand classroom /><div className="sidebar-links">{isAdmin && <small>Quản trị hệ thống</small>}{(isAdmin ? admin : teacher).map(([I, label, url]) => <Link className={route.split('?')[0] === url || url === '/manage/classes' && route.startsWith(url + '/') ? 'active' : ''} key={url} to={url}><I size={14} />{label}</Link>)}{user.role === 'admin' && <Link to={isAdmin ? '/manage' : '/admin'}><Shield size={14} />{isAdmin ? 'ClassRoom' : 'Quản trị hệ thống'}</Link>}</div><div className="sidebar-user"><span className="avatar">{user.name[0]}</span><div><b>{user.name}</b><small><Link to="/account">Hồ sơ</Link> · <button type="button" onClick={logout} disabled={isLoggingOut} aria-busy={isLoggingOut}>{isLoggingOut ? "Đang đăng xuất…" : "Đăng xuất"}</button></small></div></div></aside>{open && <button className="drawer-backdrop" aria-label="Đóng menu" onClick={() => setOpen(false)} />}<div className="management-canvas"><header><button className="nav-toggle" aria-label="Mở menu ClassRoom" onClick={() => setOpen(!open)}><Menu size={20} /></button><Link to="/manage">Khóa học</Link><span>›</span><span>{isAdmin ? 'Quản trị hệ thống' : route.includes('sessions') ? 'Buổi học' : route.includes('media') ? 'Video bài giảng' : 'ClassRoom'}</span><button className="help-link" onClick={() => setHelp(true)}>Trợ giúp <HelpCircle size={16} /></button></header><main>{children}</main></div>{help && <Modal title="Trợ giúp ClassRoom" onClose={() => setHelp(false)}><p>Tạo khóa học và bài tập, mở một lớp rồi thêm buổi học. Gán bài vào ba nhóm mức độ, theo dõi bài nộp trực tiếp và lưu nhận xét trong báo cáo.</p><div className="row wrap"><Link to="/manage/classes" className="btn primary" onClick={() => setHelp(false)}>Mở lớp học</Link><Link to="/manage/lessons" className="btn secondary" onClick={() => setHelp(false)}>Biên soạn bài học</Link></div></Modal>}</div>;
}
