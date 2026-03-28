"use client";

import { useEffect, useState } from "react";

import { Proof18Shell } from "@/components/shared/proof18-shell";
import { ScreenRouter } from "@/screens/proof18-screens";
import { useProof18Store } from "@/state/proof18-store";
import { Actor, Screen } from "@/types/proof18";

const defaultScreenByActor: Record<Actor, Screen> = {
  teen: "home",
  parent: "family-setup",
};

export default function Page() {
  const [actor, setActor] = useState<Actor>("teen");
  const [screen, setScreen] = useState<Screen>("home");
  const { treasuryFunded, familyCreated } = useProof18Store();

  useEffect(() => {
    if (actor === "teen" && !treasuryFunded) {
      setScreen("home");
    }
    if (actor === "parent" && !familyCreated) {
      setScreen("family-setup");
    }
  }, [actor, treasuryFunded, familyCreated]);

  return (
    <Proof18Shell
      actor={actor}
      screen={screen}
      setActor={(nextActor) => {
        setActor(nextActor);
        setScreen(defaultScreenByActor[nextActor]);
      }}
      setScreen={setScreen}
    >
      <ScreenRouter screen={screen} />
    </Proof18Shell>
  );
}
