import { combineRgb } from '@companion-module/base'

export const White = combineRgb(255, 255, 255)
export const Black = combineRgb(0, 0, 0)
export const DarkGrey = combineRgb(51, 51, 51)
export const Grey = combineRgb(128, 128, 128)
export const Green = combineRgb(0, 204, 0)
export const DarkGreen = combineRgb(0, 153, 0)
export const ForestGreen = combineRgb(0, 102, 0)
export const Red = combineRgb(204, 0, 0)
export const DarkRed = combineRgb(102, 0, 0)
export const Blue = combineRgb(0, 102, 204)
export const DarkBlue = combineRgb(0, 51, 153)
export const Amber = combineRgb(204, 153, 0)

/** Convert a hex colour string (#rrggbb or rrggbb) to Companion's numeric colour format */
export function hexToCompanionColor(hex: string): number {
	const clean = hex.replace(/^#/, '')
	const r = parseInt(clean.substring(0, 2), 16)
	const g = parseInt(clean.substring(2, 4), 16)
	const b = parseInt(clean.substring(4, 6), 16)
	return combineRgb(r, g, b)
}

/** Darken a Companion numeric colour by a factor (0–1, where 0.4 = 40% brightness) */
export function darkenColor(color: number, factor: number): number {
	const r = (color >> 16) & 0xff
	const g = (color >> 8) & 0xff
	const b = color & 0xff
	return combineRgb(Math.round(r * factor), Math.round(g * factor), Math.round(b * factor))
}
