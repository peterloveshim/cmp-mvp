"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentHospital } from "@/lib/hooks/use-current-hospital";
import { useCreateReferral } from "@/lib/queries/referrals";

const schema = z.object({
  patient_initial: z.string().min(1, "환자 이니셜을 입력하세요"),
  age: z.number().int().min(0).max(150),
  gender: z.enum(["M", "F"]),
  diagnosis: z.string().min(1, "주상병을 입력하세요"),
  adl: z.enum(["INDEPENDENT", "PARTIAL", "DEPENDENT"]),
  needs_oxygen: z.boolean(),
  needs_isolation: z.boolean(),
  note: z.string().optional(),
  preferred_date: z.string().min(1, "희망 회송일을 선택하세요"),
});

type FormValues = z.infer<typeof schema>;

const ADL_LABEL = {
  INDEPENDENT: "독립",
  PARTIAL: "부분의존",
  DEPENDENT: "완전의존",
};

export default function NewReferralPage() {
  const router = useRouter();
  const { hospital, isLoaded } = useCurrentHospital();
  const createReferral = useCreateReferral();

  useEffect(() => {
    if (isLoaded && !hospital) router.replace("/");
    if (isLoaded && hospital?.type === "PARTNER") router.replace("/receiver");
  }, [isLoaded, hospital, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: "M",
      adl: "INDEPENDENT",
      needs_oxygen: false,
      needs_isolation: false,
    },
  });

  const needsOxygen = watch("needs_oxygen");
  const needsIsolation = watch("needs_isolation");

  const onSubmit = async (values: FormValues) => {
    if (!hospital) return;
    const referral = await createReferral.mutateAsync({
      from_hospital_id: hospital.id,
      ...values,
      note: values.note || null,
    });
    router.push(`/sender/hospitals?referralId=${referral.id}`);
  };

  if (!isLoaded || !hospital) return null;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold">회송 요청 등록</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          환자 정보를 입력하고 협력병원을 선택합니다
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">환자 정보</CardTitle>
            <CardDescription>9개 항목을 모두 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 환자 이니셜 */}
            <div className="space-y-1.5">
              <Label htmlFor="patient_initial">환자 이니셜</Label>
              <Input
                id="patient_initial"
                placeholder="예: K.M.H"
                {...register("patient_initial")}
              />
              {errors.patient_initial && (
                <p className="text-xs text-destructive">
                  {errors.patient_initial.message}
                </p>
              )}
            </div>

            {/* 나이 + 성별 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="age">나이</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="72"
                  {...register("age", { valueAsNumber: true })}
                />
                {errors.age && (
                  <p className="text-xs text-destructive">{errors.age.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>성별</Label>
                <div className="flex gap-4 pt-2">
                  {(["M", "F"] as const).map((g) => (
                    <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        value={g}
                        {...register("gender")}
                        className="accent-primary"
                      />
                      <span className="text-sm">{g === "M" ? "남" : "여"}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 주상병 */}
            <div className="space-y-1.5">
              <Label htmlFor="diagnosis">주상병</Label>
              <Input
                id="diagnosis"
                placeholder="예: 뇌경색 회복기"
                {...register("diagnosis")}
              />
              {errors.diagnosis && (
                <p className="text-xs text-destructive">
                  {errors.diagnosis.message}
                </p>
              )}
            </div>

            {/* ADL */}
            <div className="space-y-1.5">
              <Label>ADL 점수</Label>
              <Select
                defaultValue="INDEPENDENT"
                onValueChange={(v) =>
                  setValue("adl", v as FormValues["adl"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(ADL_LABEL) as [
                      FormValues["adl"],
                      string,
                    ][]
                  ).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 산소 / 격리 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="needs_oxygen">산소 필요 여부</Label>
                <Switch
                  id="needs_oxygen"
                  checked={needsOxygen}
                  onCheckedChange={(v) => setValue("needs_oxygen", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="needs_isolation">감염 격리 필요</Label>
                <Switch
                  id="needs_isolation"
                  checked={needsIsolation}
                  onCheckedChange={(v) => setValue("needs_isolation", v)}
                />
              </div>
            </div>

            {/* 특이사항 */}
            <div className="space-y-1.5">
              <Label htmlFor="note">특이사항</Label>
              <Textarea
                id="note"
                placeholder="자유입력"
                rows={3}
                {...register("note")}
              />
            </div>

            {/* 희망 회송일 */}
            <div className="space-y-1.5">
              <Label htmlFor="preferred_date">희망 회송일</Label>
              <Input
                id="preferred_date"
                type="date"
                {...register("preferred_date")}
              />
              {errors.preferred_date && (
                <p className="text-xs text-destructive">
                  {errors.preferred_date.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || createReferral.isPending}
          >
            {createReferral.isPending ? "등록 중..." : "다음: 병원 선택"}
          </Button>
        </div>
      </form>
    </div>
  );
}
