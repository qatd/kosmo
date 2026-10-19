'use client'

import { useState, useTransition } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface VoteButtonsProps {
    score: number
    currentUserVote: "UP" | "DOWN" | null
    // onVote resolves after the server action completes; error field signals failure
    onVote: (type: "UP" | "DOWN") => Promise<{ error: string } | { success: true }>
    disabled?: boolean
}

type VoteType = "UP" | "DOWN"

// Static strings so Tailwind's scanner always includes these classes in the CSS bundle
const containerActiveClass: Record<VoteType, string> = {
    UP: "bg-vote-up text-white",
    DOWN: "bg-vote-down text-white",
}

// Inverted white chip on the voted arrow; dark: variants needed to beat the ghost variant's dark hover
const activeButtonClass: Record<VoteType, string> = {
    UP: "bg-white text-vote-up hover:bg-white hover:text-vote-up dark:hover:bg-white",
    DOWN: "bg-white text-vote-down hover:bg-white hover:text-vote-down dark:hover:bg-white",
}

// Unvoted hover previews the vote color — ghost's accent hover is invisible on the muted pill
const idleButtonClass: Record<VoteType, string> = {
    UP: "hover:bg-vote-up/25 hover:text-vote-up dark:hover:bg-vote-up/25",
    DOWN: "hover:bg-vote-down/40 hover:text-vote-down dark:hover:bg-vote-down/40",
}

const getButtonClass = (type: VoteType, currentUserVote: VoteType | null) => {
    if (currentUserVote === null) return idleButtonClass[type]
    if (currentUserVote === type) return activeButtonClass[type]
    // Faded so the active arrow stands out, restored on hover since it's still clickable
    return "opacity-50 hover:opacity-100 hover:bg-white/20 hover:text-white dark:hover:bg-white/20"
}

const computeNewState = (
    prev: { score: number; currentUserVote: VoteType | null },
    clicked: VoteType
) => {
    if (prev.currentUserVote === clicked) {
        // Toggle off the same vote
        return {
            score: prev.score + (clicked === "UP" ? -1 : 1),
            currentUserVote: null as VoteType | null,
        }
    }
    // Remove previous vote impact (if any), then add the new vote
    const removePrev = prev.currentUserVote === null ? 0 : prev.currentUserVote === "UP" ? -1 : 1
    return {
        score: prev.score + (clicked === "UP" ? 1 : -1) + removePrev,
        currentUserVote: clicked as VoteType | null,
    }
}

export const VoteButtons = ({ score, currentUserVote, onVote, disabled = false }: VoteButtonsProps) => {
    // Initialized from props on first mount only — not affected by RSC re-renders mid-transition,
    // which is what caused the useOptimistic flicker bug
    const [voteState, setVoteState] = useState({ score, currentUserVote })
    const [isPending, startTransition] = useTransition()

    const handleVote = (type: VoteType) => {
        const prev = voteState
        // Apply new state immediately for instant feedback
        setVoteState(computeNewState(voteState, type))

        startTransition(async () => {
            const result = await onVote(type)
            if ("error" in result && result.error) {
                // Revert to the state before the click
                setVoteState(prev)
                toast.error("Failed to register vote")
            }
        })
    }

    return (
        <div className={`
            inline-flex items-center gap-1 shrink-0 rounded-full px-1 py-1 transition-all
            ${voteState.currentUserVote
                ? `${containerActiveClass[voteState.currentUserVote]} hover:brightness-110`
                : "bg-muted/60"
            }
        `}>
            <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 rounded-full ${getButtonClass("UP", voteState.currentUserVote)}`}
                onClick={() => handleVote("UP")}
                disabled={isPending || disabled}
                aria-label="Upvote"
            >
                <ChevronUp className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium tabular-nums w-6 text-center">
                {voteState.score}
            </span>
            <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 rounded-full ${getButtonClass("DOWN", voteState.currentUserVote)}`}
                onClick={() => handleVote("DOWN")}
                disabled={isPending || disabled}
                aria-label="Downvote"
            >
                <ChevronDown className="h-5 w-5" />
            </Button>
        </div>
    )
}
