import assert from "node:assert/strict";
import { packageSchema } from "../schemas/packageSchema";
import { buildPackagePayloadFromFormData } from "./package-form-payload";

function formFrom(entries: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      value.forEach((v) => fd.append(key, v));
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

// Regression: editing a PT package with no opensClasses + a new coach
// used to omit opensClasses from the payload, fail Zod with a silent
// "Required" error, and never persist coachId.
{
  const fd = formFrom({
    _id: "pkg_pt_1",
    name: "PT 10 Sessions",
    price: "5000",
    numberOfSessions: "10",
    expiryPeriod: "90",
    category: "PERSONAL_TRAINING",
    coachId: "coach_new_id",
  });

  const payload = buildPackagePayloadFromFormData(fd);
  assert.deepEqual(payload.opensClasses, []);
  assert.equal(payload.coachId, "coach_new_id");

  const validated = packageSchema.parse(payload);
  assert.equal(validated.coachId, "coach_new_id");
  assert.deepEqual(validated.opensClasses, []);
  assert.equal(validated.category, "PERSONAL_TRAINING");
}

// PT without coach must fail refine
{
  const fd = formFrom({
    _id: "pkg_pt_2",
    name: "PT 5 Sessions",
    price: "3000",
    numberOfSessions: "5",
    expiryPeriod: "60",
    category: "PERSONAL_TRAINING",
  });

  const payload = buildPackagePayloadFromFormData(fd);
  assert.equal(payload.coachId, undefined);

  assert.throws(() => packageSchema.parse(payload), (err: any) => {
    assert.equal(err.issues?.[0]?.path?.[0], "coachId");
    return true;
  });
}

// Non-PT packages can omit coach; empty opensClasses still ok
{
  const fd = formFrom({
    _id: "pkg_gym_1",
    name: "Gym Access",
    price: "1000",
    numberOfSessions: "30",
    expiryPeriod: "30",
    category: "OPEN_GYM",
  });

  const validated = packageSchema.parse(buildPackagePayloadFromFormData(fd));
  assert.equal(validated.coachId, undefined);
  assert.deepEqual(validated.opensClasses, []);
}

// opensClasses with values + blank entries are filtered
{
  const fd = formFrom({
    _id: "pkg_cls_1",
    name: "Class Pack",
    price: "2000",
    numberOfSessions: "8",
    expiryPeriod: "45",
    category: "GROUP_CLASS",
    opensClasses: ["class_a", "", "class_b"],
  });

  const validated = packageSchema.parse(buildPackagePayloadFromFormData(fd));
  assert.deepEqual(validated.opensClasses, ["class_a", "class_b"]);
}

console.log("package-form-payload.test.ts: all assertions passed");
