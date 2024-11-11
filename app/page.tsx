"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "@/styles/page.module.css";

// Types
interface PeperoData {
  step: Step;
  base: string;
  topping: string;
  name: string;
}

interface StepOption {
  id: string;
  label: string;
  style: string;
}

type Step = "맛" | "토핑" | "이름" | "완성";

// Constants
const INITIAL_STEP = "맛" as const;

const BASE_OPTIONS: StepOption[] = [
  { id: "chocolate", label: "초콜릿", style: styles.chocolate },
  { id: "strawberry", label: "딸기", style: styles.strawberry },
  { id: "vanilla", label: "바닐라", style: styles.vanilla },
  { id: "white", label: "화이트초콜릿", style: styles.white },
  { id: "melon", label: "메론", style: styles.melon },
] as const;

const TOPPING_OPTIONS: StepOption[] = [
  { id: "almond", label: "아몬드", style: "" },
  { id: "sprinkles", label: "스프링클", style: "" },
  { id: "cookie", label: "쿠키 크럼블", style: "" },
] as const;

const BASE_COLORS = {
  chocolate: "#FDF1E7",
  strawberry: "#FFF0F3",
  vanilla: "#FFFBF0",
  white: "#FAFAFA",
  melon: "#F0FAF4",
} as const;

const INITIAL_STATE: PeperoData = {
  step: INITIAL_STEP,
  base: "",
  topping: "",
  name: "",
};

function PeperoMakerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [peperoState, setPeperoState] = useState<PeperoData>(() => {
    const peperoParam = searchParams.get("pepero");
    if (!peperoParam) return INITIAL_STATE;

    try {
      const decodedPepero = JSON.parse(
        decodeURIComponent(atob(peperoParam))
      ) as PeperoData;
      return {
        ...decodedPepero,
        step: determineStep(decodedPepero),
      };
    } catch {
      return INITIAL_STATE;
    }
  });

  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    const peperoParam = searchParams.get("pepero");
    if (!peperoParam) {
      setPeperoState(INITIAL_STATE);
      setShowCompletion(false);
      return;
    }

    try {
      const decodedPepero = JSON.parse(
        decodeURIComponent(atob(peperoParam))
      ) as PeperoData;
      setPeperoState({
        ...decodedPepero,
        step: determineStep(decodedPepero),
      });
      setShowCompletion(false);
    } catch {
      setPeperoState(INITIAL_STATE);
      setShowCompletion(false);
    }
  }, [searchParams]);

  const determineStep = (state: Partial<PeperoData>): Step => {
    if (!state.base) return "맛";
    if (!state.topping) return "토핑";
    if (!state.name) return "이름";
    return "완성";
  };

  const updateURL = (newState: PeperoData) => {
    const encodedPepero = btoa(encodeURIComponent(JSON.stringify(newState)));
    router.push(`?pepero=${encodedPepero}`, { scroll: false });
  };

  const handleStepChange = (updates: Partial<PeperoData>) => {
    const newState = {
      ...peperoState,
      ...updates,
      step: updates.base ? "토핑" : updates.topping ? "이름" : peperoState.step,
    } as PeperoData;

    setPeperoState(newState);
    updateURL(newState);
  };

  const handleNameChange = (name: string) => {
    setPeperoState((prev) => ({ ...prev, name }));
  };

  const handleCompletion = () => {
    if (!peperoState.name) return;

    const newState = { ...peperoState, step: "완성" as const };
    setPeperoState(newState);
    updateURL(newState);
  };

  const handleShare = async () => {
    const shareableURL = `${window.location.origin}?pepero=${btoa(
      encodeURIComponent(JSON.stringify(peperoState))
    )}`;

    try {
      await navigator.clipboard.writeText(shareableURL);
      setShowCompletion(true);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const handleReset = () => {
    setPeperoState(INITIAL_STATE);
    router.push("/", { scroll: false });
  };

  if (showCompletion) {
    return <CompletionOverlay onClose={() => setShowCompletion(false)} />;
  }

  return (
    <div
      className={styles.container}
      style={{
        backgroundColor: peperoState.base
          ? BASE_COLORS[peperoState.base as keyof typeof BASE_COLORS]
          : "#fff",
      }}>
      <h1 className={styles.title}>빼빼로메이커</h1>

      {peperoState.step !== "완성" && (
        <h2 className={styles.step}>{peperoState.step}을 선택해주세요</h2>
      )}

      <PeperoDisplay base={peperoState.base} topping={peperoState.topping} />

      <div className={styles.peperoForm}>
        {peperoState.step === "완성" ? (
          <CompletionStep
            peperoState={peperoState}
            onReset={handleReset}
            onShare={handleShare}
            baseOptions={BASE_OPTIONS}
            toppingOptions={TOPPING_OPTIONS}
          />
        ) : (
          <StepOptions
            currentStep={peperoState.step}
            peperoState={peperoState}
            onStepChange={handleStepChange}
            onNameChange={handleNameChange}
            onComplete={handleCompletion}
          />
        )}
      </div>
    </div>
  );
}

export default function PeperoMaker() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <h1 className={styles.title}>빼빼로메이커</h1>
          <p>Loading...</p>
        </div>
      }>
      <PeperoMakerContent />
    </Suspense>
  );
}

// Subcomponents
function PeperoDisplay({ base, topping }: { base: string; topping: string }) {
  return (
    <div className={styles.peperoContainer}>
      <div className={styles.peperoStick}>
        <div className={`${styles.peperoBase} ${base ? styles[base] : ""}`}>
          {topping && (
            <div
              className={`${styles.peperoTopping} ${styles[topping]}`}
              style={{
                backgroundImage: `url(/toppings/${topping}.png)`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepOptions({
  currentStep,
  peperoState,
  onStepChange,
  onNameChange,
  onComplete,
}: {
  currentStep: Step;
  peperoState: PeperoData;
  onStepChange: (updates: Partial<PeperoData>) => void;
  onNameChange: (name: string) => void;
  onComplete: () => void;
}) {
  switch (currentStep) {
    case "맛":
      return (
        <div className={styles.optionsContainer}>
          {BASE_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`${styles.option} ${option.style}`}
              onClick={() => onStepChange({ base: option.id })}>
              {option.label}
            </div>
          ))}
        </div>
      );

    case "토핑":
      return (
        <div className={styles.optionsContainer}>
          {TOPPING_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`${styles.option} ${option.style}`}
              onClick={() => onStepChange({ topping: option.id })}>
              {option.label}
            </div>
          ))}
        </div>
      );

    case "이름":
      return (
        <div className={styles.nameInputContainer}>
          <input
            type="text"
            value={peperoState.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="이름을 입력해주세요"
            className={styles.nameInput}
          />
          <button
            onClick={onComplete}
            className={styles.completeButton}
            disabled={!peperoState.name}>
            완료
          </button>
        </div>
      );

    default:
      return null;
  }
}

function CompletionStep({
  peperoState,
  onReset,
  onShare,
  baseOptions,
  toppingOptions,
}: {
  peperoState: PeperoData;
  onReset: () => void;
  onShare: () => void;
  baseOptions: readonly StepOption[];
  toppingOptions: readonly StepOption[];
}) {
  return (
    <div className={styles.completionStep}>
      <div className={styles.completionHeader}>
        <h2 className={styles.completionStepTitle}>
          {peperoState.name}맛 빼빼로 완성!
        </h2>
        <p className={styles.completionDescription}>
          나만의 특별한 빼빼로가 완성되었어요!
        </p>
      </div>

      <div className={styles.peperoDetails}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>맛</span>
          <span className={styles.detailValue}>
            {baseOptions.find((opt) => opt.id === peperoState.base)?.label}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>토핑</span>
          <span className={styles.detailValue}>
            {
              toppingOptions.find((opt) => opt.id === peperoState.topping)
                ?.label
            }
          </span>
        </div>
      </div>

      <div className={styles.completionActions}>
        <button onClick={onReset} className={styles.newButton}>
          새로 만들기
        </button>
        <button onClick={onShare} className={styles.shareButton}>
          공유하기
        </button>
      </div>
    </div>
  );
}

function CompletionOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.completionOverlay}>
      <div className={styles.completionContent}>
        <h2 className={styles.completionTitle}>링크가 복사되었습니다!</h2>
        <p className={styles.completionText}>친구들과 공유해보세요</p>
        <button onClick={onClose} className={styles.closeButton}>
          닫기
        </button>
      </div>
    </div>
  );
}
