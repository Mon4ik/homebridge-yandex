export function kelvin2rgb(temp: number): number[] {
	temp = temp / 100
	let red, blue, green

	if (temp <= 66) {
		red = 255
	} else {
		red = temp - 60
		red = 329.698727466 * Math.pow(red, -0.1332047592)
		if (red < 0) {
			red = 0
		}
		if (red > 255) {
			red = 255
		}
	}

	if (temp <= 66) {
		green = temp
		green = 99.4708025861 * Math.log(green) - 161.1195681661
		if (green < 0) {
			green = 0
		}
		if (green > 255) {
			green = 255
		}
	} else {
		green = temp - 60
		green = 288.1221695283 * Math.pow(green, -0.0755148492)
		if (green < 0) {
			green = 0
		}
		if (green > 255) {
			green = 255
		}
	}

	if (temp >= 66) {
		blue = 255
	} else {
		if (temp <= 19) {
			blue = 0
		} else {
			blue = temp - 10
			blue = 138.5177312231 * Math.log(blue) - 305.0447927307
			if (blue < 0) {
				blue = 0
			}
			if (blue > 255) {
				blue = 255
			}
		}
	}

	return [red, green, blue].map(Math.floor)
}

export function rgb2hsv(r: number, g: number, b: number) {
	let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn
	rabs = r / 255
	gabs = g / 255
	babs = b / 255
	v = Math.max(rabs, gabs, babs),
		diff = v - Math.min(rabs, gabs, babs)
	diffc = c => (v - c) / 6 / diff + 1 / 2
	percentRoundFn = num => Math.round(num * 100) / 100

	if (diff == 0) {
		h = s = 0
	} else {
		s = diff / v
		rr = diffc(rabs)
		gg = diffc(gabs)
		bb = diffc(babs)

		if (rabs === v) {
			h = bb - gg
		} else if (gabs === v) {
			h = (1 / 3) + rr - bb
		} else if (babs === v) {
			h = (2 / 3) + gg - rr
		}
		if (h < 0) {
			h += 1
		} else if (h > 1) {
			h -= 1
		}
	}
	return {
		h: Math.round(h * 360),
		s: percentRoundFn(s * 100),
		v: percentRoundFn(v * 100)
	}
}