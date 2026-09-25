import type { IconType } from "react-icons";
import {
  HiOutlineArrowDown, HiOutlineArrowLeft, HiOutlineArrowPath, HiOutlineArrowPathRoundedSquare,
  HiOutlineArrowRight, HiOutlineArrowRightOnRectangle, HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowUpRight, HiOutlineArrowUturnLeft, HiOutlineArrowsPointingIn, HiOutlineArrowsPointingOut,
  HiOutlineBars3, HiOutlineBolt, HiOutlineBriefcase, HiOutlineCalendar, HiOutlineCalendarDays,
  HiOutlineCheck, HiOutlineCheckCircle, HiOutlineChevronRight, HiOutlineCircleStack,
  HiOutlineClipboardDocumentList, HiOutlineClock, HiOutlineCodeBracket, HiOutlineCommandLine,
  HiOutlineCreditCard, HiOutlineCurrencyDollar, HiOutlineEnvelope, HiOutlineExclamationCircle,
  HiOutlineGlobeAlt, HiOutlineInbox, HiOutlineKey, HiOutlineLinkSlash, HiOutlineMinus, HiOutlineMoon,
  HiOutlinePaperAirplane, HiOutlinePlus, HiOutlineRectangleStack, HiOutlineServerStack,
  HiOutlineShieldCheck, HiOutlineSignal, HiOutlineSparkles, HiOutlineSquares2X2, HiOutlineSun,
  HiOutlineUser, HiOutlineUserCircle, HiOutlineUsers, HiOutlineVideoCamera, HiOutlineXMark,
} from "react-icons/hi2";

function customize(Icon: IconType): IconType {
  return function MacmIcon({ className, ...props }) {
    return <Icon {...props} className={("macm-icon " + (className ?? "")).trim()} />;
  };
}

export const Activity = customize(HiOutlineSignal);
export const AlertCircle = customize(HiOutlineExclamationCircle);
export const ArrowDown = customize(HiOutlineArrowDown);
export const ArrowLeft = customize(HiOutlineArrowLeft);
export const ArrowRight = customize(HiOutlineArrowRight);
export const ArrowUpRight = customize(HiOutlineArrowUpRight);
export const BriefcaseBusiness = customize(HiOutlineBriefcase);
export const Calendar = customize(HiOutlineCalendar);
export const CalendarClock = customize(HiOutlineCalendarDays);
export const CalendarDays = customize(HiOutlineCalendarDays);
export const Check = customize(HiOutlineCheck);
export const CheckCircle2 = customize(HiOutlineCheckCircle);
export const ChevronRight = customize(HiOutlineChevronRight);
export const CircleDollarSign = customize(HiOutlineCurrencyDollar);
export const CircleUserRound = customize(HiOutlineUserCircle);
export const Clock = customize(HiOutlineClock);
export const Clock3 = customize(HiOutlineClock);
export const ClipboardList = customize(HiOutlineClipboardDocumentList);
export const Code2 = customize(HiOutlineCodeBracket);
export const Command = customize(HiOutlineCommandLine);
export const CreditCard = customize(HiOutlineCreditCard);
export const Database = customize(HiOutlineCircleStack);
export const ExternalLink = customize(HiOutlineArrowTopRightOnSquare);
export const FileClock = customize(HiOutlineClock);
export const Globe2 = customize(HiOutlineGlobeAlt);
export const Inbox = customize(HiOutlineInbox);
export const KeyRound = customize(HiOutlineKey);
export const Layers = customize(HiOutlineRectangleStack);
export const Layers3 = customize(HiOutlineRectangleStack);
export const LayoutDashboard = customize(HiOutlineSquares2X2);
export const Loader2 = customize(HiOutlineArrowPathRoundedSquare);
export const LogOut = customize(HiOutlineArrowRightOnRectangle);
export const Mail = customize(HiOutlineEnvelope);
export const Menu = customize(HiOutlineBars3);
export const Maximize2 = customize(HiOutlineArrowsPointingOut);
export const Minimize2 = customize(HiOutlineArrowsPointingIn);
export const Minus = customize(HiOutlineMinus);
export const Moon = customize(HiOutlineMoon);
export const Plus = customize(HiOutlinePlus);
export const RefreshCw = customize(HiOutlineArrowPath);
export const RotateCcw = customize(HiOutlineArrowUturnLeft);
export const Send = customize(HiOutlinePaperAirplane);
export const ServerCog = customize(HiOutlineServerStack);
export const ShieldCheck = customize(HiOutlineShieldCheck);
export const Sparkles = customize(HiOutlineSparkles);
export const Sun = customize(HiOutlineSun);
export const Unplug = customize(HiOutlineLinkSlash);
export const UserRound = customize(HiOutlineUser);
export const UsersRound = customize(HiOutlineUsers);
export const Video = customize(HiOutlineVideoCamera);
export const X = customize(HiOutlineXMark);
export const Zap = customize(HiOutlineBolt);
