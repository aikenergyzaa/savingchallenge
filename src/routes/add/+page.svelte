<script lang="ts">
    import { supabase } from "$lib/supabaseClient";
    import { goto } from "$app/navigation";
    import { Upload, Loader2 } from "lucide-svelte";
    import { currentUser } from "$lib/userStore";
    import {
        getJarAllocations,
        resolveJarForExpenseCategory,
        type JarAllocation,
        type JarKey,
    } from "$lib/jars";
    import { runSlipOcr, type SlipOcrResult } from "$lib/slipOcr";
    import { resolveOwner } from "$lib/owner";
    import { getReceiptPreviewUrl } from "$lib/receiptUrl";
    import { getSupabaseErrorMessage } from "$lib/supabaseError";
    import { prepareReceiptUpload } from "$lib/utils/receiptUpload";
    import {
        getCategoriesByType,
        getAiAllowedCategories,
        type TransactionType,
    } from "$lib/categories";

    import { page } from "$app/stores";
    import { onMount } from "svelte";

    let type: TransactionType = "expense";
    let amount: number | null = null;
    let category = "";
    let date = new Date().toISOString().split("T")[0];
    let note = "";
    let file: File | null = null;
    let loading = false;
    let isEditMode = false;
    let transactionId: string | null = null;
    let currentImagePath: string | null = null;

    let categories = getCategoriesByType(type);
    $: categories = getCategoriesByType(type);

    let incomeAllocationPreview: JarAllocation[] = [];
    $: incomeAllocationPreview =
        type === "income" && amount && amount > 0 ? getJarAllocations(amount) : [];

    let customCategory = "";
    let ocrLoading = false;
    let ocrProgress = 0;
    let ocrError = "";
    let ocrResult: SlipOcrResult | null = null;
    let ocrAutoFilled = false;
    let ocrPendingApply = false;
    let ocrRawText: string | null = null;
    let ocrConfidence: number | null = null;
    let ocrAnalysisToken = 0;
    let aiCategorizing = false;
    let aiCategoryMessage = "";
    let aiCategoryConfidence: number | null = null;
    let aiCategorySource: "minimax" | "fallback" | null = null;
    let supportsOcrColumns: boolean | null = null;

    const MAX_OCR_RAW_TEXT_LENGTH = 12000;
    const OCR_METADATA_WARNING_MESSAGE =
        "บันทึกสำเร็จ แต่ฐานข้อมูลยังไม่รองรับข้อมูล OCR จึงบันทึกเฉพาะรายการและรูปภาพ (แนะนำรัน add_ocr_metadata.sql)";

    onMount(async () => {
        transactionId = $page.url.searchParams.get("id");
        if (transactionId) {
            isEditMode = true;
            loading = true;
            const { owner } = await resolveOwner(supabase, $currentUser);
            if (!owner) {
                loading = false;
                alert("ไม่พบผู้ใช้สำหรับโหลดข้อมูล");
                return;
            }

            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("id", transactionId)
                .eq("owner", owner)
                .single();

            if (data) {
                type = data.type;
                amount = data.amount;
                date = data.date;
                note = data.note || "";
                currentImagePath = data.image_path;
                ocrRawText = data.ocr_raw_text || null;
                const parsedConfidence = Number.parseFloat(
                    String(data.ocr_confidence ?? ""),
                );
                ocrConfidence = Number.isFinite(parsedConfidence)
                    ? parsedConfidence
                    : null;

                // Handle category
                const availableCategories = getCategoriesByType(data.type);
                if (availableCategories.includes(data.category)) {
                    category = data.category;
                } else {
                    category = "Other (อื่นๆ)";
                    customCategory = data.category;
                }

                if (currentImagePath) {
                    previewUrl = await getReceiptPreviewUrl(currentImagePath);
                }
            }
            loading = false;
        } else {
            // Ensure date is always today when adding new transaction
            date = new Date().toISOString().split("T")[0];

            const presetType = $page.url.searchParams.get("type");
            if (presetType === "income" || presetType === "expense") {
                type = presetType;
            }

            const presetCategory = $page.url.searchParams.get("category");
            if (presetCategory) {
                const availableCategories = getCategoriesByType(type);
                if (availableCategories.includes(presetCategory)) {
                    category = presetCategory;
                } else {
                    category = "Other (อื่นๆ)";
                    customCategory = presetCategory;
                }
            }

            const presetNote = $page.url.searchParams.get("note");
            if (presetNote) {
                note = presetNote;
            }
        }
    });

    $: if (category && !categories.includes(category)) {
        category = "";
    }

    $: if (!category.startsWith("Other")) {
        customCategory = "";
    }

    async function resolveOwnerForWrite(): Promise<string> {
        const { owner } = await resolveOwner(supabase, $currentUser);
        if (!owner) throw new Error("Owner is not available");
        return owner;
    }

    async function cleanupReceiptUpload(filePath: string | null): Promise<void> {
        if (!filePath) return;
        const { error } = await supabase.storage.from("receipts").remove([filePath]);
        if (error) {
            console.warn("Receipt cleanup failed:", error);
        }
    }

    function normalizeOcrRawText(value: string | null): string | null {
        const text = sanitizeDbText(value, MAX_OCR_RAW_TEXT_LENGTH);
        if (!text) return null;
        return text;
    }

    function normalizeOcrConfidence(value: number | null): number | null {
        if (typeof value !== "number" || !Number.isFinite(value)) return null;
        const clamped = Math.max(0, Math.min(100, value));
        return Math.round((clamped + Number.EPSILON) * 100) / 100;
    }

    function sanitizeDbText(value: unknown, maxLength = 2000): string {
        const normalized =
            typeof value === "string"
                ? value
                      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
                      .replace(/[\uD800-\uDFFF]/g, "")
                      .replace(/\s+/g, " ")
                      .trim()
                : "";
        if (!normalized) return "";
        return normalized.length > maxLength
            ? normalized.slice(0, maxLength).trim()
            : normalized;
    }

    function isOcrMetadataError(message: string): boolean {
        const lowered = message.toLowerCase();
        return lowered.includes("ocr_raw_text") || lowered.includes("ocr_confidence");
    }

    function isValidIsoDate(value: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const [yearRaw, monthRaw, dayRaw] = value.split("-");
        const year = Number.parseInt(yearRaw, 10);
        const month = Number.parseInt(monthRaw, 10);
        const day = Number.parseInt(dayRaw, 10);
        if (
            !Number.isInteger(year) ||
            !Number.isInteger(month) ||
            !Number.isInteger(day)
        ) {
            return false;
        }
        const utc = new Date(Date.UTC(year, month - 1, day));
        return (
            utc.getUTCFullYear() === year &&
            utc.getUTCMonth() === month - 1 &&
            utc.getUTCDate() === day
        );
    }

    async function writeTransactionWithOptionalOcrColumns(
        basePayload: Record<string, unknown>,
        optionalOcrPayload: Record<string, unknown>,
        ownerForWrite: string,
    ) {
        const hasOcrMetadata = Object.keys(optionalOcrPayload).length > 0;
        let includeOcrMetadata = supportsOcrColumns !== false && hasOcrMetadata;
        let ocrMetadataDropped = hasOcrMetadata && !includeOcrMetadata;

        const runWrite = async (payload: Record<string, unknown>) => {
            if (isEditMode && transactionId) {
                const { error: updateError } = await supabase
                    .from("transactions")
                    .update(payload)
                    .eq("id", transactionId)
                    .eq("owner", ownerForWrite);
                return updateError;
            }

            const { error: insertError } = await supabase
                .from("transactions")
                .insert(payload);
            return insertError;
        };

        let error = await runWrite(
            includeOcrMetadata ? { ...basePayload, ...optionalOcrPayload } : basePayload,
        );

        if (!error && includeOcrMetadata) {
            supportsOcrColumns = true;
            return {
                error: null,
                ocrMetadataDropped: false,
            };
        }

        const message =
            typeof error === "object" && error && "message" in error
                ? String((error as { message?: unknown }).message || "")
                : "";

        if (error && includeOcrMetadata && isOcrMetadataError(message)) {
            supportsOcrColumns = false;
            includeOcrMetadata = false;
            ocrMetadataDropped = hasOcrMetadata;
            error = await runWrite(basePayload);
        }

        if (!error && hasOcrMetadata && includeOcrMetadata === false) {
            supportsOcrColumns = false;
            ocrMetadataDropped = true;
        }

        return {
            error,
            ocrMetadataDropped,
        };
    }

    async function handleSubmit() {
        // Use custom category if 'Other' is selected
        const finalCategory =
            category.startsWith("Other") && customCategory
                ? customCategory
                : category;
        let sanitizedCategory = sanitizeDbText(finalCategory, 120);
        const sanitizedNote = sanitizeDbText(note, 4000);
        const normalizedDate = String(date || "").trim();

        if (category.trim() === "") {
            category = "Other (อื่นๆ)";
            sanitizedCategory = "Other (อื่นๆ)";
        }

        if (!amount || !Number.isFinite(amount) || amount <= 0) {
            alert("กรุณาระบุจำนวนเงินมากกว่า 0");
            return;
        }
        if (!sanitizedCategory) {
            alert("กรุณาเลือกหมวดหมู่");
            return;
        }
        if (!isValidIsoDate(normalizedDate)) {
            alert("วันที่ไม่ถูกต้อง กรุณาเลือกวันที่ใหม่อีกครั้ง");
            return;
        }

        const jar_key: JarKey | null =
            type === "expense"
                ? resolveJarForExpenseCategory(sanitizedCategory || finalCategory)
                : null;

        loading = true;
        let ownerForWrite: string;
        try {
            ownerForWrite = await resolveOwnerForWrite();
        } catch (error) {
            console.error("Resolve owner failed:", error);
            alert("ไม่สามารถระบุเจ้าของข้อมูลได้ กรุณาเข้าสู่ระบบใหม่");
            loading = false;
            return;
        }

        let image_path = currentImagePath;
        let uploadedImagePath: string | null = null;

        if (file) {
            try {
                const prepared = await prepareReceiptUpload(file);
                const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${prepared.ext}`;
                const filePath = `${ownerForWrite}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("receipts")
                    .upload(filePath, prepared.body, {
                        contentType: prepared.contentType,
                    });

                if (uploadError) throw uploadError;

                image_path = filePath;
                uploadedImagePath = filePath;
            } catch (error) {
                console.error("Upload error:", error);
                alert(getSupabaseErrorMessage("อัปโหลดรูปภาพไม่สำเร็จ", error));
                loading = false;
                return;
            }
        }

        const basePayload = {
            type,
            amount,
            category: sanitizedCategory,
            date: normalizedDate,
            note: sanitizedNote || null,
            image_path,
            jar_key,
            owner: ownerForWrite,
        };
        const optionalOcrPayload: Record<string, unknown> = {};
        const normalizedRawText = normalizeOcrRawText(ocrRawText);
        const normalizedConfidence = normalizeOcrConfidence(ocrConfidence);
        if (normalizedRawText !== null) optionalOcrPayload.ocr_raw_text = normalizedRawText;
        if (normalizedConfidence !== null) {
            optionalOcrPayload.ocr_confidence = normalizedConfidence;
        }

        const { error, ocrMetadataDropped } = await writeTransactionWithOptionalOcrColumns(
            basePayload,
            optionalOcrPayload,
            ownerForWrite,
        );

        if (error) {
            await cleanupReceiptUpload(uploadedImagePath);
            console.error("Error saving transaction:", error);
            alert(getSupabaseErrorMessage("บันทึกรายการไม่สำเร็จ", error));
        } else {
            if (ocrMetadataDropped) {
                alert(OCR_METADATA_WARNING_MESSAGE);
            }
            const shouldCleanupPreviousReceipt =
                isEditMode &&
                uploadedImagePath &&
                currentImagePath &&
                currentImagePath !== uploadedImagePath;
            if (shouldCleanupPreviousReceipt) {
                await cleanupReceiptUpload(currentImagePath);
            }

            if (isEditMode) {
                goto(`/transactions/${transactionId}`);
            } else {
                goto("/");
            }
        }
        loading = false;
    }

    let previewUrl: string | null = null;

    async function handleNoSpend() {
        if (!confirm("ยืนยันว่าวันนี้ไม่ได้ใช้เงินเลย? (สุดยอด! 🎉)")) return;

        loading = true;
        let ownerForWrite: string;
        try {
            ownerForWrite = await resolveOwnerForWrite();
        } catch (error) {
            console.error("Resolve owner failed:", error);
            alert("ไม่สามารถระบุเจ้าของข้อมูลได้ กรุณาเข้าสู่ระบบใหม่");
            loading = false;
            return;
        }
        const { error } = await supabase.from("transactions").insert({
            type: "expense",
            amount: 0,
            category: "No Spend",
            date,
            note: "No Spend Day! 🎉",
            jar_key: "expense",
            owner: ownerForWrite,
        });

        if (error) {
            console.error("Error saving no spend day:", error);
            alert(getSupabaseErrorMessage("บันทึกรายการวันไม่ใช้เงินไม่สำเร็จ", error));
        } else {
            goto("/");
        }
        loading = false;
    }

    function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            file = target.files[0];
            ocrAutoFilled = false;
            ocrPendingApply = false;
            ocrResult = null;
            ocrError = "";
            ocrProgress = 0;
            ocrRawText = null;
            ocrConfidence = null;
            const reader = new FileReader();
            reader.onload = (e) => {
                previewUrl = e.target?.result as string;
            };
            reader.readAsDataURL(file);

            void analyzeSlip(file);
        }
    }

    function applyOcrResult(result: SlipOcrResult, force = false) {
        if (result.inferredType) {
            type = result.inferredType;
        }

        if (result.amount !== null) {
            amount = result.amount;
        }

        if (result.date) {
            date = result.date;
        }

        if (result.note && (force || !note.trim())) {
            note = result.note;
        }

        if (!category) {
            category =
                result.inferredType === "income"
                    ? "Salary (เงินเดือน)"
                    : "Other (อื่นๆ)";
        }

        const availableCategories = getCategoriesByType(type);
        if (!availableCategories.includes(category)) {
            category = "Other (อื่นๆ)";
        }

        ocrRawText = result.rawText || null;
        ocrConfidence = result.confidence;
        ocrAutoFilled = true;
    }

    function willOverwriteExistingValues(result: SlipOcrResult): boolean {
        const amountWillChange =
            result.amount !== null && amount !== null && amount !== result.amount;
        const dateWillChange = !!result.date && !!date && date !== result.date;
        const noteWillChange =
            !!result.note.trim() &&
            !!note.trim() &&
            note.trim() !== result.note.trim();

        return amountWillChange || dateWillChange || noteWillChange;
    }

    function handleApplyOcr() {
        if (!ocrResult) return;

        if (willOverwriteExistingValues(ocrResult)) {
            const shouldOverwrite = confirm(
                "OCR จะเขียนทับข้อมูลที่คุณกรอกไว้บางส่วน ต้องการดำเนินการต่อหรือไม่?",
            );
            if (!shouldOverwrite) return;
        }

        applyOcrResult(ocrResult, true);
        ocrPendingApply = false;
    }

    async function analyzeSlip(targetFile: File) {
        const currentToken = ++ocrAnalysisToken;
        ocrLoading = true;
        ocrProgress = 0;
        ocrError = "";

        try {
            const result = await runSlipOcr(targetFile, (progress) => {
                if (currentToken === ocrAnalysisToken) {
                    ocrProgress = progress;
                }
            });

            if (currentToken !== ocrAnalysisToken) return;
            ocrResult = result;
            ocrPendingApply = true;
            ocrAutoFilled = false;
        } catch (error) {
            if (currentToken !== ocrAnalysisToken) return;
            console.error("OCR error:", error);
            ocrError = "อ่านสลิปไม่สำเร็จ ลองอัปโหลดรูปที่คมชัดขึ้นอีกครั้ง";
        } finally {
            if (currentToken === ocrAnalysisToken) {
                ocrLoading = false;
            }
        }
    }

    async function categorizeFromNoteWithAI() {
        const trimmedNote = note.trim();
        if (!trimmedNote) {
            alert("กรุณาใส่บันทึกช่วยจำก่อนใช้ AI จัดหมวด");
            return;
        }

        aiCategorizing = true;
        aiCategoryMessage = "";
        aiCategoryConfidence = null;
        aiCategorySource = null;

        try {
            const response = await fetch("/api/classify-note", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    note: trimmedNote,
                    type,
                    categories: getAiAllowedCategories(type),
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error || "AI classification failed");
            }

            const selectedCategory = String(result.category || "").trim();
            if (categories.includes(selectedCategory)) {
                category = selectedCategory;
                customCategory = "";
            } else {
                category = "Other (อื่นๆ)";
            }

            aiCategoryConfidence = Number.isFinite(Number(result.confidence))
                ? Math.max(0, Math.min(1, Number(result.confidence)))
                : null;
            aiCategorySource =
                result.source === "minimax" || result.source === "fallback"
                    ? result.source
                    : null;
            aiCategoryMessage =
                String(result.reason || "").trim() || "จัดหมวดหมู่สำเร็จ";
        } catch (error) {
            console.error("AI categorize error:", error);
            aiCategoryMessage =
                "ไม่สามารถจัดหมวดด้วย AI ได้ในขณะนี้ ลองใหม่อีกครั้ง";
        } finally {
            aiCategorizing = false;
        }
    }
</script>

<div class="space-y-6">
    <section class="hero-panel p-6 md:p-8">
        <div class="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <div class="eyebrow text-white/65">Transaction Atelier</div>
                <h2 class="mt-2 text-4xl font-extrabold tracking-tight text-white">
                    {isEditMode ? "แก้ไขรายการ" : "บันทึกรายการใหม่"}
                </h2>
                <p class="mt-2 text-sm text-white/72">
                    บันทึกรายรับ, รายจ่าย, OCR และ AI classification โดยใช้ workflow เดิม
                </p>
            </div>
            {#if !isEditMode}
                <div class="flex flex-wrap gap-2">
                    <a
                        href="/add/bulk"
                        class="lux-button-secondary border-white/10 bg-white/10 text-white"
                    >
                        อัปหลายสลิป
                    </a>
                    <button
                        type="button"
                        on:click={handleNoSpend}
                        class="lux-button bg-[#d8af52] px-5 py-3 font-bold text-[#171411]"
                    >
                        วันนี้ไม่ได้ใช้เงินเลย
                    </button>
                </div>
            {/if}
        </div>
    </section>

<div class="glass-panel p-6 md:p-8">
    <div class="mb-6 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-[#171411]">
            {isEditMode ? "แก้ไขรายการ" : "บันทึกรายการใหม่"}
        </h2>
        <div class="eyebrow">{type === "income" ? "Income Flow" : "Expense Flow"}</div>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- Type Switcher -->
        <div class="grid grid-cols-2 gap-2 rounded-full bg-[#efe7d8] p-1">
            <button
                type="button"
                class="rounded-full py-3 font-medium transition-colors {type ===
                'income'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-[#6f665c]'}"
                on:click={() => (type = "income")}
            >
                รายรับ
            </button>
            <button
                type="button"
                class="rounded-full py-3 font-medium transition-colors {type ===
                'expense'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-[#6f665c]'}"
                on:click={() => (type = "expense")}
            >
                รายจ่าย
            </button>
        </div>

        <!-- Amount -->
        <div class="field-shell">
            <label
                for="amount"
                class="field-label"
                >จำนวนเงิน</label
            >
            <input
                id="amount"
                type="number"
                bind:value={amount}
                required
                min="0"
                step="0.01"
                class="lux-input text-lg"
                placeholder="0.00"
            />
        </div>

        {#if type === "income" && incomeAllocationPreview.length > 0}
            <div class="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
                <h3 class="font-bold text-emerald-800 mb-1">
                    Auto-Allocation 4 กระปุก
                </h3>
                <p class="text-xs text-emerald-700 mb-3">
                    ระบบแนะนำการแบ่งรายรับทันทีตามสัดส่วน 40/20/20/20
                </p>
                <div class="grid grid-cols-2 gap-2">
                    {#each incomeAllocationPreview as jar}
                        <div class="rounded-[18px] border border-emerald-100 bg-white p-3">
                            <div class="text-[11px] text-slate-500">
                                {jar.label} ({Math.round(jar.percent * 100)}%)
                            </div>
                            <div class="font-bold text-slate-800 text-sm">
                                ฿{jar.amount.toLocaleString()}
                            </div>
                            <div class="text-[11px] text-slate-500">
                                {jar.labelTh}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Category -->
        <div class="field-shell">
            <label
                for="category"
                class="field-label"
                >หมวดหมู่</label
            >
            <select
                id="category"
                bind:value={category}
                required
                class="lux-input"
            >
                <option value="" disabled selected>เลือกหมวดหมู่</option>
                {#each categories as cat}
                    <option value={cat}>{cat}</option>
                {/each}
            </select>

            {#if category.startsWith("Other")}
                <input
                    type="text"
                    bind:value={customCategory}
                    required
                    class="lux-input mt-2"
                    placeholder="ระบุชื่อหมวดหมู่..."
                    aria-label="ระบุชื่อหมวดหมู่"
                />
            {/if}
        </div>

        <!-- Date -->
        <div class="field-shell">
            <label
                for="date"
                class="field-label"
                >วันที่</label
            >
            <input
                id="date"
                type="date"
                bind:value={date}
                required
                class="lux-input"
            />
        </div>

        <!-- Note -->
        <div class="field-shell">
            <label
                for="note"
                class="field-label"
                >บันทึกช่วยจำ (ถ้ามี)</label
            >
            <textarea
                id="note"
                bind:value={note}
                rows="2"
                class="lux-input"
                placeholder="รายละเอียดเพิ่มเติม..."
            ></textarea>

            <div class="mt-2 flex items-center justify-between gap-2">
                <button
                    type="button"
                    on:click={categorizeFromNoteWithAI}
                    disabled={aiCategorizing || !note.trim()}
                    class="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {#if aiCategorizing}
                        <Loader2 size={12} class="animate-spin" />
                        AI กำลังวิเคราะห์...
                    {:else}
                        ใช้ AI จัดหมวดหมู่
                    {/if}
                </button>

                {#if aiCategoryConfidence !== null}
                    <span class="text-[11px] text-slate-500">
                        ความมั่นใจ {Math.round(aiCategoryConfidence * 100)}%
                    </span>
                {/if}
            </div>

            {#if aiCategoryMessage}
                <div
                    class="mt-2 rounded-[18px] p-3 text-xs {aiCategorySource ===
                    'fallback'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-blue-50 text-blue-700 border border-blue-100'}"
                >
                    {aiCategoryMessage}
                    {#if aiCategorySource}
                        <span class="opacity-70"> ({aiCategorySource})</span>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Image Upload -->
        <div class="field-shell">
            <label
                for="file-upload-label"
                class="field-label"
                >รูปสลิป / ใบเสร็จ</label
            >
            <div class="relative">
                <input
                    type="file"
                    accept="image/*"
                    on:change={handleFileSelect}
                    class="hidden"
                    id="file-upload"
                />
                <label
                    id="file-upload-label"
                    for="file-upload"
                    class="flex w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[24px] border-2 border-dashed border-[#cdbfa8] px-4 py-5 text-[#6f665c] transition-colors hover:border-[#b4872f] hover:text-[#171411]"
                >
                    {#if previewUrl}
                        <img
                            src={previewUrl}
                            alt="Preview"
                            class="max-h-48 rounded-lg object-contain"
                        />
                        <span class="text-xs mt-2">แตะเพื่อเปลี่ยนรูป</span>
                    {:else}
                        <Upload size={20} />
                        <span>{file ? file.name : "อัพโหลดรูปภาพ"}</span>
                    {/if}
                </label>
            </div>

            {#if ocrLoading}
                <div class="mt-3 rounded-[20px] border border-blue-100 bg-blue-50 p-3">
                    <div class="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
                        <Loader2 size={16} class="animate-spin" />
                        กำลังอ่านข้อมูลจากสลิป...
                    </div>
                    <div class="h-2 bg-white rounded overflow-hidden">
                        <div
                            class="h-2 bg-blue-500 transition-all"
                            style="width: {Math.round(ocrProgress * 100)}%"
                        ></div>
                    </div>
                    <div class="text-xs text-blue-700 mt-1">
                        {Math.round(ocrProgress * 100)}%
                    </div>
                </div>
            {/if}

            {#if ocrError}
                <div class="mt-3 rounded-[20px] border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                    {ocrError}
                </div>
            {/if}

            {#if ocrResult && !ocrLoading}
                <div class="mt-3 rounded-[20px] border border-emerald-100 bg-emerald-50 p-3 space-y-2">
                    <div class="flex justify-between items-center">
                        <h4 class="text-sm font-bold text-emerald-800">
                            OCR อ่านสลิปสำเร็จ
                        </h4>
                        <button
                            type="button"
                            class="text-xs font-medium text-emerald-700 hover:underline"
                            on:click={handleApplyOcr}
                        >
                            {ocrAutoFilled ? "Apply OCR อีกครั้ง" : "Apply OCR"}
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="rounded bg-white p-2 border border-emerald-100">
                            <div class="text-slate-500">ยอดเงิน</div>
                            <div class="font-semibold text-slate-700">
                                {ocrResult.amount !== null
                                    ? `฿${ocrResult.amount.toLocaleString()}`
                                    : "-"}
                            </div>
                        </div>
                        <div class="rounded bg-white p-2 border border-emerald-100">
                            <div class="text-slate-500">วันที่</div>
                            <div class="font-semibold text-slate-700">
                                {ocrResult.date || "-"}
                            </div>
                        </div>
                    </div>
                    <div class="text-xs text-slate-600">
                        ความมั่นใจ OCR: {ocrResult.confidence !== null
                            ? `${ocrResult.confidence.toFixed(1)}%`
                            : "-"}
                    </div>
                    <div class="text-xs text-slate-600">
                        โน้ตที่อ่านได้: {ocrResult.note}
                    </div>
                    {#if ocrPendingApply}
                        <div class="text-[11px] text-amber-700">
                            ยังไม่เติมค่าลงฟอร์ม กด Apply OCR เพื่อยืนยันก่อนใช้งาน
                        </div>
                    {/if}
                    {#if ocrAutoFilled}
                        <div class="text-[11px] text-emerald-700">
                            เติมค่าลงฟอร์มแล้ว คุณสามารถแก้ไขต่อได้
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Submit Button -->
        <button
            type="submit"
            disabled={loading}
            class="lux-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
            {#if loading}
                <Loader2 class="animate-spin" size={20} />
                กำลังบันทึก...
            {:else}
                {isEditMode ? "อัพเดทรายการ" : "บันทึกรายการ"}
            {/if}
        </button>
    </form>
</div>
</div>
