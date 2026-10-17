import { useForm } from "@tanstack/react-form";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "cn";

import { Field } from "@/components/common/Field";
import { Spinner } from "@/components/common/Spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/catalog";
import type { Product } from "@/lib/db";
import { toUserMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import { MAX_IMAGE_DATA_URL_LENGTH, downscaleImage } from "@/lib/image";
import { createProduct, updateProduct } from "@/lib/server/products";

interface ProductFormValues {
	name: string;
	umkm: string;
	category: ProductCategory;
	description: string;
	price: string;
	stock: string;
	image: string;
}

type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

const DEFAULT_CATEGORY: ProductCategory = "Kain Ulos";

function toFormValues(product?: Product | null): ProductFormValues {
	return {
		name: product?.name ?? "",
		umkm: product?.umkm ?? "",
		category: (product?.category as ProductCategory | undefined) ?? DEFAULT_CATEGORY,
		description: product?.description ?? "",
		price: product ? String(product.price) : "",
		stock: product ? String(product.stock) : "",
		image: product?.image ?? "",
	};
}

function validate(values: ProductFormValues): FieldErrors {
	const errors: FieldErrors = {};

	if (!values.name.trim()) {
		errors.name = "Nama produk wajib diisi";
	} else if (values.name.trim().length > 120) {
		errors.name = "Nama produk maksimal 120 karakter";
	}

	if (!values.umkm.trim()) {
		errors.umkm = "Nama UMKM wajib diisi";
	} else if (values.umkm.trim().length > 120) {
		errors.umkm = "Nama UMKM maksimal 120 karakter";
	}

	if (!values.description.trim()) {
		errors.description = "Deskripsi wajib diisi";
	} else if (values.description.trim().length > 2000) {
		errors.description = "Deskripsi maksimal 2000 karakter";
	}

	const price = Number(values.price);
	if (values.price.trim() === "" || !Number.isFinite(price)) {
		errors.price = "Masukkan harga yang valid";
	} else if (!Number.isInteger(price)) {
		errors.price = "Harga harus bilangan bulat (rupiah)";
	} else if (price < 0) {
		errors.price = "Harga tidak boleh negatif";
	}

	const stock = Number(values.stock);
	if (values.stock.trim() === "" || !Number.isFinite(stock) || !Number.isInteger(stock)) {
		errors.stock = "Masukkan jumlah stok (bilangan bulat)";
	} else if (stock < 0) {
		errors.stock = "Stok tidak boleh negatif";
	}

	return errors;
}

function ProductForm({
	product,
	onClose,
	onSaved,
}: {
	product?: Product | null;
	onClose: () => void;
	onSaved: () => void;
}) {
	const createFn = useServerFn(createProduct);
	const updateFn = useServerFn(updateProduct);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [errors, setErrors] = useState<FieldErrors>({});
	const [serverError, setServerError] = useState("");
	const [imageError, setImageError] = useState("");
	const [imageBusy, setImageBusy] = useState(false);
	const [urlInput, setUrlInput] = useState("");

	/*
	 * The form is fully controlled by TanStack Form. `defaultValues` is read
	 * once per mount, and this component is keyed by product id (see
	 * `ProductFormModal`), so:
	 *   - typing updates the store and re-renders only this subtree, and
	 *   - switching between "new" and an existing product gets a clean form
	 *     without ever remounting *while* the user types.
	 */
	const form = useForm({
		defaultValues: toFormValues(product),
		onSubmit: async ({ value }) => {
			setServerError("");
			const validationErrors = validate(value);
			setErrors(validationErrors);
			if (Object.values(validationErrors).some(Boolean)) return;

			try {
				const payload = {
					name: value.name.trim(),
					umkm: value.umkm.trim(),
					category: value.category,
					description: value.description.trim(),
					price: Number(value.price),
					stock: Number(value.stock),
					image: value.image.trim(),
				};
				if (product) {
					await updateFn({ data: { id: product.id, ...payload } });
				} else {
					await createFn({ data: payload });
				}
				onSaved();
				onClose();
			} catch (error) {
				setServerError(toUserMessage(error, "Gagal menyimpan produk."));
			}
		},
	});

	const clearError = (key: keyof ProductFormValues) =>
		setErrors((previous) => (previous[key] ? { ...previous, [key]: undefined } : previous));

	const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		setImageError("");
		if (!file.type.startsWith("image/")) {
			setImageError("Pilih berkas gambar (PNG, JPG, WEBP, atau GIF)");
			return;
		}
		if (file.size > 8 * 1024 * 1024) {
			setImageError("Gambar terlalu besar — pilih berkas di bawah 8MB");
			return;
		}
		setImageBusy(true);
		try {
			const dataUrl = await downscaleImage(file);
			if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
				setImageError("Gambar masih terlalu besar setelah dikompres. Coba gambar lain.");
				return;
			}
			form.setFieldValue("image", dataUrl);
		} catch (error) {
			setImageError(toUserMessage(error, "Gambar tidak dapat diproses"));
		} finally {
			setImageBusy(false);
		}
	};

	const applyUrl = () => {
		const value = urlInput.trim();
		if (!value) return;
		setImageError("");
		if (!/^https?:\/\//i.test(value)) {
			setImageError("Tautan gambar harus diawali http:// atau https://");
			return;
		}
		form.setFieldValue("image", value);
	};

	const imageValue = form.state.values.image;

	return (
		<>
			<DialogHeader>
				<DialogTitle>{product ? "Ubah produk" : "Produk baru"}</DialogTitle>
				<DialogDescription>
					{product
						? "Perbarui detail produk di bawah ini, lalu simpan perubahan."
						: "Tambahkan produk UKM ke katalog. Kolom bertanda * wajib diisi."}
				</DialogDescription>
			</DialogHeader>

			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
				className="space-y-5"
				noValidate
			>
				{serverError ? (
					<Alert variant="destructive" data-testid="product-form-error">
						<AlertDescription>{serverError}</AlertDescription>
					</Alert>
				) : null}

				<form.Field name="name">
					{(field) => (
						<Field label="Nama produk" htmlFor={field.name} required error={errors.name}>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => {
									field.handleChange(event.target.value);
									clearError("name");
								}}
								placeholder="mis. Ulos Ragidup"
								aria-invalid={Boolean(errors.name)}
								autoComplete="off"
							/>
						</Field>
					)}
				</form.Field>

				<div className="grid gap-5 sm:grid-cols-2">
					<form.Field name="umkm">
						{(field) => (
							<Field label="UMKM / pengrajin" htmlFor={field.name} required error={errors.umkm}>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => {
										field.handleChange(event.target.value);
										clearError("umkm");
									}}
									placeholder="mis. Tenun Sianipar"
									aria-invalid={Boolean(errors.umkm)}
									autoComplete="off"
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name="category">
						{(field) => (
							<Field label="Kategori" htmlFor={field.name} required>
								<Select
									value={field.state.value}
									onValueChange={(value) => field.handleChange(value as ProductCategory)}
								>
									<SelectTrigger id={field.name} className="w-full" aria-label="Kategori">
										<SelectValue placeholder="Pilih kategori" />
									</SelectTrigger>
									<SelectContent>
										{PRODUCT_CATEGORIES.map((category) => (
											<SelectItem key={category} value={category}>
												{category}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
					</form.Field>
				</div>

				<form.Field name="description">
					{(field) => (
						<Field label="Deskripsi" htmlFor={field.name} required error={errors.description}>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => {
									field.handleChange(event.target.value);
									clearError("description");
								}}
								placeholder="Ceritakan keunggulan produk ini…"
								aria-invalid={Boolean(errors.description)}
								rows={3}
							/>
						</Field>
					)}
				</form.Field>

				<div className="grid gap-5 sm:grid-cols-2">
					<form.Field name="price">
						{(field) => {
							const numeric = Number(field.state.value);
							return (
								<Field
									label="Harga (Rp)"
									htmlFor={field.name}
									required
									error={errors.price}
									description={
										field.state.value.trim() !== "" && Number.isFinite(numeric)
											? formatCurrency(numeric)
											: "Masukkan harga dalam rupiah, tanpa titik."
									}
								>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										inputMode="numeric"
										min={0}
										step="1"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => {
											field.handleChange(event.target.value);
											clearError("price");
										}}
										placeholder="1250000"
										aria-invalid={Boolean(errors.price)}
									/>
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="stock">
						{(field) => (
							<Field label="Stok" htmlFor={field.name} required error={errors.stock}>
								<Input
									id={field.name}
									name={field.name}
									type="number"
									inputMode="numeric"
									min={0}
									step="1"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => {
										field.handleChange(event.target.value);
										clearError("stock");
									}}
									placeholder="0"
									aria-invalid={Boolean(errors.stock)}
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<Field
					label="Gambar produk"
					description="Opsional. Gambar diperkecil otomatis hingga maksimal 512px sebelum disimpan."
				>
					<div className="flex flex-col gap-4 sm:flex-row">
						<div className="bg-muted border-border relative grid size-32 shrink-0 place-items-center overflow-hidden rounded-xl border">
							{imageValue ? (
								<img src={imageValue} alt="Pratinjau produk" className="size-full object-cover" />
							) : imageBusy ? (
								<Loader2 className="text-muted-foreground size-6 animate-spin" />
							) : (
								<ImagePlus className="text-muted-foreground size-6" />
							)}
						</div>

						<div className="flex-1 space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => fileInputRef.current?.click()}
									disabled={imageBusy}
								>
									{imageBusy ? <Spinner /> : <ImagePlus className="size-4" />}
									{imageValue ? "Ganti" : "Unggah"}
								</Button>
								{imageValue ? (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => {
											form.setFieldValue("image", "");
											setUrlInput("");
											setImageError("");
										}}
									>
										<Trash2 className="size-4" />
										Hapus
									</Button>
								) : null}
							</div>

							<div className="flex gap-2">
								<Input
									value={urlInput}
									onChange={(event) => setUrlInput(event.target.value)}
									placeholder="https://contoh.com/gambar.jpg"
									type="url"
									className="h-9"
									aria-label="Tautan gambar"
								/>
								<Button type="button" variant="secondary" size="sm" onClick={applyUrl}>
									Pakai URL
								</Button>
							</div>

							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(event) => void handleFile(event)}
							/>

							{imageError ? (
								<p className="text-destructive text-xs font-medium" role="alert">
									{imageError}
								</p>
							) : null}
						</div>
					</div>
				</Field>

				<DialogFooter className={cn("gap-2 pt-1")}>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={form.state.isSubmitting}
					>
						Batal
					</Button>
					<Button type="submit" disabled={form.state.isSubmitting || imageBusy}>
						{form.state.isSubmitting ? <Spinner /> : null}
						{product ? "Simpan perubahan" : "Tambah produk"}
					</Button>
				</DialogFooter>
			</form>
		</>
	);
}

export function ProductFormModal({
	open,
	onOpenChange,
	product,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product?: Product | null;
	onSaved: () => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				{/*
				 * Keyed so a fresh form instance is created when the dialog opens
				 * or the target product changes. Keystrokes never change this key,
				 * so typing can never remount (and therefore reset) the form.
				 */}
				<ProductForm
					key={`${open ? "open" : "closed"}:${product?.id ?? "new"}`}
					product={product}
					onClose={() => onOpenChange(false)}
					onSaved={onSaved}
				/>
			</DialogContent>
		</Dialog>
	);
}
