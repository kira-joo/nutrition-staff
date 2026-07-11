"use client";

import { CustomButton, type CustomButtonProps } from "@kira-joo/frontend-toolkit-tailwind";

export interface ActionButtonProps extends CustomButtonProps {
  onAction?: () => void;
}

export function ActionButton({ onAction, onClick, ...buttonProps }: ActionButtonProps) {
  return (
    <CustomButton
      onClick={(event) => {
        onClick?.(event);
        onAction?.();
      }}
      {...buttonProps}
    />
  );
}
