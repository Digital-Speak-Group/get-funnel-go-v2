import * as React from "react";
import {
  Activity, Award, Banknote, BarChart, BarChart2, Bell, Bot, Brain, Briefcase, Calendar,
  CalendarCheck, CalendarX, ChartBar, Check, CircleCheck, Clipboard, Clock, Coins, Cpu,
  CreditCard, Crown, Database, DollarSign, Eye, Filter, Flag, Funnel, Gauge, Gift, Globe,
  Handshake, Headphones, Heart, Hourglass, Infinity as InfinityIcon, Layers, Layout, Lightbulb,
  LineChart, Lock, Magnet, Mail, MapPin, Megaphone, MessageCircle, MousePointerClick, Percent,
  Phone, PieChart, Play, Presentation, Puzzle, Repeat, Rocket, Route, Search, Send, Settings,
  Shield, ShieldCheck, ShoppingCart, Smartphone, Sparkles, Star, Target, ThumbsUp, Timer,
  TrendingDown, TrendingUp, Trophy, Users, Video, Wallet, Workflow, Zap, type LucideIcon,
} from "lucide-react";
import { isSlideIconName, type SlideIconName } from "@/lib/slides/icons";

const ICONS: Record<SlideIconName, LucideIcon> = {
  "trending-up": TrendingUp, "trending-down": TrendingDown, "bar-chart": BarChart,
  "bar-chart-2": BarChart2, chart: ChartBar, "line-chart": LineChart, "pie-chart": PieChart,
  activity: Activity, gauge: Gauge, target: Target, award: Award, trophy: Trophy, crown: Crown,
  star: Star, rocket: Rocket, zap: Zap, flag: Flag,
  "dollar-sign": DollarSign, wallet: Wallet, coins: Coins, banknote: Banknote,
  "credit-card": CreditCard, "shopping-cart": ShoppingCart, percent: Percent, gift: Gift,
  filter: Filter, funnel: Funnel, magnet: Magnet, megaphone: Megaphone,
  "mouse-pointer-click": MousePointerClick, route: Route, workflow: Workflow, repeat: Repeat,
  layers: Layers, layout: Layout, presentation: Presentation, video: Video, play: Play, eye: Eye,
  search: Search,
  users: Users, handshake: Handshake, "message-circle": MessageCircle, mail: Mail, phone: Phone,
  smartphone: Smartphone, send: Send, bell: Bell, headphones: Headphones,
  clock: Clock, timer: Timer, hourglass: Hourglass, calendar: Calendar,
  "calendar-check": CalendarCheck, "calendar-x": CalendarX, clipboard: Clipboard,
  shield: Shield, "shield-check": ShieldCheck, lock: Lock, check: Check,
  "circle-check": CircleCheck, "thumbs-up": ThumbsUp, heart: Heart,
  lightbulb: Lightbulb, sparkles: Sparkles, brain: Brain, bot: Bot, cpu: Cpu, database: Database,
  settings: Settings, puzzle: Puzzle, globe: Globe, "map-pin": MapPin, briefcase: Briefcase,
  infinity: InfinityIcon,
};

interface SlideIconProps {
  /** Bullet.icon: a curated icon name, or legacy free text such as an emoji. */
  name?: string;
  size: number;
  /** Shown when `name` is empty or an unknown word. */
  fallback?: React.ReactNode;
}

// Free text without letters (emoji, "✓", "→") is intentional decoration; words that aren't
// known icon names would otherwise print literally ("award"), so they fall back instead.
const HAS_LETTERS = /[a-z]/i;

export function SlideIcon({ name, size, fallback = null }: SlideIconProps) {
  const value = name?.trim();
  if (!value) return <>{fallback}</>;
  if (isSlideIconName(value)) {
    const Icon = ICONS[value];
    return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
  }
  return <>{HAS_LETTERS.test(value) ? fallback : value}</>;
}
