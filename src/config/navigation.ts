import type { LucideIcon } from 'lucide-react'
import {
	Gift,
	BookOpen,
	Dices,
	Layers,
	TrendingUp,
	Megaphone,
	Gamepad2,
} from 'lucide-react'

export interface NavigationItem {
	key: string // 用于翻译键，如 'codes' -> t('nav.codes')
	path: string // URL 路径，如 '/codes'
	icon: LucideIcon // Lucide 图标组件
	isContentType: boolean // 是否对应 content/ 目录
}

// 内容导航分类（community 分类按需求排除，不做导航）
export const NAVIGATION_CONFIG: NavigationItem[] = [
	{ key: 'codes', path: '/codes', icon: Gift, isContentType: true },
	{ key: 'guide', path: '/guide', icon: BookOpen, isContentType: true },
	{ key: 'luck', path: '/luck', icon: Dices, isContentType: true },
	{ key: 'cards', path: '/cards', icon: Layers, isContentType: true },
	{ key: 'progression', path: '/progression', icon: TrendingUp, isContentType: true },
	{ key: 'release', path: '/release', icon: Megaphone, isContentType: true },
	{ key: 'roblox', path: '/roblox', icon: Gamepad2, isContentType: true },
]

// 从配置派生内容类型列表（用于路由和内容加载）
export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item) => item.isContentType).map(
	(item) => item.path.slice(1),
) // 移除开头的 '/' -> ['codes', 'guide', 'luck', 'cards', 'progression', 'release', 'roblox']

export type ContentType = (typeof CONTENT_TYPES)[number]

// 辅助函数：验证内容类型
export function isValidContentType(type: string): type is ContentType {
	return CONTENT_TYPES.includes(type as ContentType)
}
