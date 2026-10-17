/**
 * Client-side image helper.
 *
 * Product images are capped at 512px on the longest edge. Anything larger is
 * downscaled on a canvas before we hand back a `data:` URL, which keeps the
 * payload small enough for the in-memory store (and the server-side guard).
 */
export const MAX_IMAGE_DIMENSION = 512;

/** Matches `MAX_IMAGE_LENGTH` in `src/lib/server/products.ts`. */
export const MAX_IMAGE_DATA_URL_LENGTH = 720_000;

export async function downscaleImage(
	file: File,
	maxDimension: number = MAX_IMAGE_DIMENSION,
): Promise<string> {
	const dataUrl = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error("Could not read that file"));
		reader.readAsDataURL(file);
	});

	const image = await new Promise<HTMLImageElement>((resolve, reject) => {
		const element = new Image();
		element.onload = () => resolve(element);
		element.onerror = () => reject(new Error("That image format is not supported"));
		element.src = dataUrl;
	});

	const longestEdge = Math.max(image.width, image.height);
	const scale = longestEdge > maxDimension ? maxDimension / longestEdge : 1;
	const width = Math.max(1, Math.round(image.width * scale));
	const height = Math.max(1, Math.round(image.height * scale));

	// Nothing to shrink and the source is already a sensible format: keep it as-is.
	if (scale === 1 && dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) {
		return dataUrl;
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) return dataUrl;

	context.drawImage(image, 0, 0, width, height);

	const prefersPng = file.type === "image/png";
	const output = canvas.toDataURL(prefersPng ? "image/png" : "image/jpeg", 0.85);
	return output.length > MAX_IMAGE_DATA_URL_LENGTH && !prefersPng
		? canvas.toDataURL("image/jpeg", 0.7)
		: output;
}
