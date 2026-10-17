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
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/db";
import { downscaleImage } from "@/lib/image";
import { createProduct, updateProduct } from "@/lib/server/products";

interface ProductFormValues {
	name: string;
	description: string;
	price: string;
	stock: string;
	image: string;
}

type FieldErrors = Record<string, string | undefined>;

function validate(values: ProductFormValues): FieldErrors {
	const errors: FieldErrors = {};
	if (!values.name.trim()) {
		errors.name = "Name is required";
	} else if (values.name.trim().length > 120) {
		errors.name = "Name must be 120 characters or fewer";
	}

	if (!values.description.trim()) {
		errors.description = "Description is required";
	} else if (values.description.trim().length > 2000) {
		errors.description = "Description must be 2000 characters or fewer";
	}

	const price = Number(values.price);
	if (values.price.trim() === "" || !Number.isFinite(price)) {
		errors.price = "Enter a valid price";
	} else if (price < 0) {
		errors.price = "Price cannot be negative";
	}

	const stock = Number(values.stock);
	if (values.stock.trim() === "" || !Number.isFinite(stock) || !Number.isInteger(stock)) {
		errors.stock = "Enter a whole number";
	} else if (stock < 0) {
		errors.stock = "Stock cannot be negative";
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

	const form = useForm({
		defaultValues: {
			name: product?.name ?? "",
			description: product?.description ?? "",
			price: product ? String(product.price) : "",
			stock: product ? String(product.stock) : "",
			image: product?.image ?? "",
		} as ProductFormValues,
		onSubmit: async ({ value }) => {
			setServerError("");
			const validationErrors = validate(value);
			setErrors(validationErrors);
			if (Object.values(validationErrors).some(Boolean)) return;

			try {
				const payload = {
					name: value.name.trim(),
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
				setServerError(error instanceof Error ? error.message : "Something went wrong");
			}
		},
	});

	const clearError = (key: string) =>
		setErrors((previous) => (previous[key] ? { ...previous, [key]: undefined } : previous));

	const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		setImageError("");
		if (!file.type.startsWith("image/")) {
			setImageError("Please choose an image file (PNG, JPG, WEBP or GIF)");
			return;
		}
		if (file.size > 8 * 1024 * 1024) {
			setImageError("That image is too large — pick one under 8MB");
			return;
		}
		setImageBusy(true);
		try {
			const dataUrl = await downscaleImage(file);
			form.setFieldValue("image", dataUrl);
		} catch (error) {
			setImageError(error instanceof Error ? error.message : "Could not process that image");
		} finally {
			setImageBusy(false);
		}
	};

	const applyUrl = () => {
		const value = urlInput.trim();
		if (!value) return;
		setImageError("");
		if (!/^https?:\/\//i.test(value)) {
			setImageError("Image URLs must start with http:// or https://");
			return;
		}
		form.setFieldValue("image", value);
	};

	const imageValue = form.state.values.image;

	return (
		<>
			<DialogHeader>
				<DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
				<DialogDescription>
					{product
						? "Update the details below and save your changes."
						: "Add a product to your catalogue. Fields marked with * are required."}
				</DialogDescription>
			</DialogHeader>

			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
				className="space-y-5"
			>
				{serverError ? (
					<Alert variant="destructive">
						<AlertDescription>{serverError}</AlertDescription>
					</Alert>
				) : null}

				<form.Field name="name">
					{(field) => (
						<Field label="Name" htmlFor={field.name} required error={errors.name}>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => {
									field.handleChange(event.target.value);
									clearError("name");
								}}
								placeholder="e.g. Starter Kit"
								aria-invalid={Boolean(errors.name)}
								autoComplete="off"
							/>
						</Field>
					)}
				</form.Field>

				<form.Field name="description">
					{(field) => (
						<Field label="Description" htmlFor={field.name} required error={errors.description}>
							<Textarea
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => {
									field.handleChange(event.target.value);
									clearError("description");
								}}
								placeholder="What makes this product useful?"
								aria-invalid={Boolean(errors.description)}
								rows={3}
							/>
						</Field>
					)}
				</form.Field>

				<div className="grid gap-5 sm:grid-cols-2">
					<form.Field name="price">
						{(field) => (
							<Field label="Price (USD)" htmlFor={field.name} required error={errors.price}>
								<Input
									id={field.name}
									type="number"
									inputMode="decimal"
									min={0}
									step="0.01"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => {
										field.handleChange(event.target.value);
										clearError("price");
									}}
									placeholder="0.00"
									aria-invalid={Boolean(errors.price)}
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name="stock">
						{(field) => (
							<Field label="Stock" htmlFor={field.name} required error={errors.stock}>
								<Input
									id={field.name}
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
					label="Product image"
					description="Optional. Images are resized to a maximum of 512px before saving."
				>
					<div className="flex flex-col gap-4 sm:flex-row">
						<div className="bg-muted border-border relative grid size-32 shrink-0 place-items-center overflow-hidden rounded-xl border">
							{imageValue ? (
								<img src={imageValue} alt="Product preview" className="size-full object-cover" />
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
									{imageValue ? "Replace" : "Upload"}
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
										Remove
									</Button>
								) : null}
							</div>

							<div className="flex gap-2">
								<Input
									value={urlInput}
									onChange={(event) => setUrlInput(event.target.value)}
									placeholder="https://example.com/image.jpg"
									type="url"
									className="h-9"
								/>
								<Button type="button" variant="secondary" size="sm" onClick={applyUrl}>
									Use URL
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
						Cancel
					</Button>
					<Button type="submit" disabled={form.state.isSubmitting || imageBusy}>
						{form.state.isSubmitting ? <Spinner /> : null}
						{product ? "Save changes" : "Create product"}
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
				<ProductForm product={product} onClose={() => onOpenChange(false)} onSaved={onSaved} />
			</DialogContent>
		</Dialog>
	);
}
