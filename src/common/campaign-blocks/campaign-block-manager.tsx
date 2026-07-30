"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, Modal, toast, useConfirmDialog } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  addCampaignBlockEndpoint,
  removeCampaignBlockEndpoint,
  reorderCampaignBlocksEndpoint,
  replaceCampaignBlockEndpoint,
} from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type { CampaignBlock } from "../interfaces/campaign-block.interface";
import { campaignBlockRegistry } from "./campaign-block-registry";

export interface CampaignBlockManagerProps {
  campaignId: string;
  blocks: CampaignBlock[];
  onChanged: () => void;
}

/**
 * The Campaign builder's block list: add/edit/delete/reorder, each backed
 * by its own sub-resource request (see the plan's Campaign-blocks
 * architecture) — refetches the whole campaign after every change, since
 * the parent page owns the actual data.
 *
 * Reordering uses move-up/move-down buttons rather than drag-and-drop, same
 * substitution already established for DoctorProfile's gallery in
 * Checkpoint D — no drag-and-drop dependency exists in the toolkit yet, and
 * nothing here requires introducing one.
 */
export function CampaignBlockManager({ campaignId, blocks, onChanged }: CampaignBlockManagerProps) {
  const { confirm, dialog } = useConfirmDialog();
  const [adding, setAdding] = useState<CampaignBlockType | null>(null);
  const [editingBlock, setEditingBlock] = useState<CampaignBlock | null>(null);

  const removeMutation = useRequesterMutation({
    endpoint: removeCampaignBlockEndpoint,
    onSuccess: () => {
      toast.success("Block removed");
      onChanged();
    },
  });
  const reorderMutation = useRequesterMutation({ endpoint: reorderCampaignBlocksEndpoint, onSuccess: onChanged });

  function handleMove(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const blockIds = blocks.map((block) => block.id);
    [blockIds[index], blockIds[target]] = [blockIds[target], blockIds[index]];
    reorderMutation.mutate({ params: { campaignId }, body: { blockIds } });
  }

  async function handleRemove(block: CampaignBlock): Promise<void> {
    const confirmed = await confirm({
      title: "Remove block?",
      description: "This permanently deletes the block and any assets it owns.",
      confirmText: "Remove",
      variant: "destructive",
    });
    if (confirmed) removeMutation.mutate({ params: { campaignId, blockId: block.id } });
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        const { Preview, label } = campaignBlockRegistry[block.type];
        return (
          <div key={block.id} className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-slate-500">{label}</span>
              <div className="flex gap-1">
                <CustomButton
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => handleMove(index, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Move down"
                  disabled={index === blocks.length - 1}
                  onClick={() => handleMove(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </CustomButton>
                <CustomButton type="button" size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditingBlock(block)}>
                  <Pencil className="h-4 w-4" />
                </CustomButton>
                <CustomButton type="button" size="icon" variant="ghost" aria-label="Remove" onClick={() => handleRemove(block)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </CustomButton>
              </div>
            </div>
            <Preview block={block} />
          </div>
        );
      })}

      <CustomButton type="button" variant="outline" leftIcon={Plus} onClick={() => setAdding(CampaignBlockType.HERO)}>
        Add Hero block
      </CustomButton>

      {adding ? (
        <Modal open onOpenChange={() => setAdding(null)} title={`Add ${campaignBlockRegistry[adding].label} block`} size="lg">
          {(() => {
            const { Editor } = campaignBlockRegistry[adding];
            return (
              <Editor
                endpoint={addCampaignBlockEndpoint}
                submitParams={{ campaignId }}
                onSuccess={() => {
                  setAdding(null);
                  onChanged();
                }}
              />
            );
          })()}
        </Modal>
      ) : null}

      {editingBlock ? (
        <Modal
          open
          onOpenChange={() => setEditingBlock(null)}
          title={`Edit ${campaignBlockRegistry[editingBlock.type].label} block`}
          size="lg"
        >
          {(() => {
            const { Editor } = campaignBlockRegistry[editingBlock.type];
            return (
              <Editor
                defaultValues={editingBlock}
                endpoint={replaceCampaignBlockEndpoint}
                submitParams={{ campaignId, blockId: editingBlock.id }}
                onSuccess={() => {
                  setEditingBlock(null);
                  onChanged();
                }}
              />
            );
          })()}
        </Modal>
      ) : null}

      {dialog}
    </div>
  );
}
