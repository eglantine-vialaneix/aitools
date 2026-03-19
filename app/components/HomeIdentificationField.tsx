"use client";

import { Input, Label, TextField } from "@heroui/react";

export function HomeIdentificationField() {
  return (
    <TextField className="w-full max-w-xl" isDisabled>
      <Label>Identification key</Label>
      <Input placeholder="Coming soon: enter your identification key" />
    </TextField>
  );
}
