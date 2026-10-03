import {
  Caregiver,
  Elder,
  HealthObservation,
  MedicationPlan,
  PillboxCheck,
  RefillReminder,
} from './types';

/** 生成药盒示意照片（SVG data URL，演示用） */
export function pillboxPhoto(color: string, label: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">` +
    `<rect width="320" height="240" rx="16" fill="${color}"/>` +
    `<rect x="40" y="60" width="240" height="120" rx="12" fill="#ffffff" opacity="0.9"/>` +
    `<line x1="100" y1="60" x2="100" y2="180" stroke="${color}" stroke-width="4"/>` +
    `<line x1="160" y1="60" x2="160" y2="180" stroke="${color}" stroke-width="4"/>` +
    `<line x1="220" y1="60" x2="220" y2="180" stroke="${color}" stroke-width="4"/>` +
    `<circle cx="70" cy="120" r="14" fill="${color}"/>` +
    `<circle cx="130" cy="120" r="14" fill="${color}" opacity="0.6"/>` +
    `<text x="160" y="215" font-size="20" text-anchor="middle" fill="#ffffff">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** 以今天为基准的相对日期（ISO 日期串） */
export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function seedStaff(): Caregiver[] {
  return [
    { id: 'hk-1', name: '王慧（管家）', role: 'housekeeper' },
    { id: 'cg-1', name: '李芳（护工）', role: 'caregiver' },
    { id: 'cg-2', name: '张敏（护工）', role: 'caregiver' },
  ];
}

export function seedElders(): Elder[] {
  return [
    {
      id: 'elder-1',
      name: '陈建国',
      gender: 'male',
      age: 76,
      address: '阳光社区 3 栋 2 单元 501',
      conditions: ['高血压', '糖尿病'],
      housekeeperId: 'hk-1',
      familyContacts: [
        {
          name: '陈晓峰',
          relation: '儿子',
          phone: '138****6601',
          isBuyer: true,
        },
        {
          name: '陈晓芸',
          relation: '女儿',
          phone: '139****2210',
          isBuyer: false,
        },
      ],
    },
    {
      id: 'elder-2',
      name: '刘秀兰',
      gender: 'female',
      age: 81,
      address: '阳光社区 7 栋 1 单元 302',
      conditions: ['高血压', '冠心病'],
      housekeeperId: 'hk-1',
      familyContacts: [
        { name: '赵强', relation: '儿子', phone: '137****8890', isBuyer: true },
      ],
    },
    {
      id: 'elder-3',
      name: '周文斌',
      gender: 'male',
      age: 69,
      address: '阳光社区 5 栋 3 单元 101',
      conditions: ['糖尿病'],
      housekeeperId: 'hk-1',
      familyContacts: [
        { name: '周婷', relation: '女儿', phone: '136****5543', isBuyer: true },
      ],
    },
  ];
}

export function seedMedicationPlans(): MedicationPlan[] {
  return [
    {
      id: 'plan-1',
      elderId: 'elder-1',
      medicineName: '苯磺酸氨氯地平片 5mg',
      condition: '高血压',
      unit: '片',
      dosagePerIntake: 1,
      timesPerDay: 1,
      boxCapacity: 28,
      remainingQty: 5, // 余量不足 → 触发 low_stock
      nextVisitDate: daysFromNow(20),
      purchaseHabit: {
        buyerName: '陈晓峰',
        channel: '医保定点药店',
        leadTimeDays: 3,
        cycleDays: 28,
        lastPurchaseAt: daysFromNow(-23),
      },
      registeredBy: 'hk-1',
      createdAt: daysFromNow(-60),
      active: true,
    },
    {
      id: 'plan-2',
      elderId: 'elder-1',
      medicineName: '盐酸二甲双胍片 0.5g',
      condition: '糖尿病',
      unit: '片',
      dosagePerIntake: 1,
      timesPerDay: 2,
      boxCapacity: 60,
      remainingQty: 34,
      nextVisitDate: daysFromNow(5), // 复诊临近 → 触发 visit_due
      purchaseHabit: {
        buyerName: '陈晓峰',
        channel: '社区医院',
        leadTimeDays: 2,
        cycleDays: 30,
        lastPurchaseAt: daysFromNow(-29), // 临近购买周期 → 触发 purchase_cycle
      },
      registeredBy: 'hk-1',
      createdAt: daysFromNow(-90),
      active: true,
    },
    {
      id: 'plan-3',
      elderId: 'elder-2',
      medicineName: '缬沙坦胶囊 80mg',
      condition: '高血压',
      unit: '粒',
      dosagePerIntake: 1,
      timesPerDay: 1,
      boxCapacity: 28,
      remainingQty: 2, // 严重不足 → urgent
      nextVisitDate: daysFromNow(12),
      purchaseHabit: {
        buyerName: '赵强',
        channel: '线上药房',
        leadTimeDays: 4,
        cycleDays: 28,
        lastPurchaseAt: daysFromNow(-26),
      },
      registeredBy: 'hk-1',
      createdAt: daysFromNow(-45),
      active: true,
    },
    {
      id: 'plan-4',
      elderId: 'elder-3',
      medicineName: '格列美脲片 2mg',
      condition: '糖尿病',
      unit: '片',
      dosagePerIntake: 1,
      timesPerDay: 1,
      boxCapacity: 30,
      remainingQty: 18,
      nextVisitDate: daysFromNow(30),
      purchaseHabit: {
        buyerName: '周婷',
        channel: '医保定点药店',
        leadTimeDays: 5,
        cycleDays: 30,
        lastPurchaseAt: daysFromNow(-12),
      },
      registeredBy: 'hk-1',
      createdAt: daysFromNow(-30),
      active: true,
    },
  ];
}

export function seedChecks(): PillboxCheck[] {
  return [
    {
      id: 'check-1',
      elderId: 'elder-1',
      caregiverId: 'cg-1',
      caregiverName: '李芳（护工）',
      checkedAt: `${daysFromNow(-2)}T09:30:00.000Z`,
      photoUrl: pillboxPhoto('#5B8FF9', '陈建国·药盒核查'),
      remainingQty: 6,
      issueType: 'missed_dose',
      issueNote: '周一、周三早格剩余药片，老人忘记服用',
    },
    {
      id: 'check-2',
      elderId: 'elder-2',
      caregiverId: 'cg-2',
      caregiverName: '张敏（护工）',
      checkedAt: `${daysFromNow(-1)}T10:10:00.000Z`,
      photoUrl: pillboxPhoto('#F6A35C', '刘秀兰·药盒核查'),
      remainingQty: 3,
      issueType: 'mixed_meds',
      issueNote: '降压药与家属自购保健品混放在同一格',
    },
    {
      id: 'check-3',
      elderId: 'elder-3',
      caregiverId: 'cg-1',
      caregiverName: '李芳（护工）',
      checkedAt: `${daysFromNow(-1)}T15:40:00.000Z`,
      photoUrl: pillboxPhoto('#5AD8A6', '周文斌·药盒核查'),
      remainingQty: 18,
      issueType: 'none',
      issueNote: '',
    },
  ];
}

export function seedObservations(): HealthObservation[] {
  return [
    {
      id: 'obs-1',
      elderId: 'elder-1',
      checkId: 'check-1',
      type: 'missed_dose',
      clinicalNote:
        '核查发现苯磺酸氨氯地平片连续两次未按时服用，血压晨峰控制存在波动风险，建议复测晨起血压并随访。',
      familySuggestion:
        '发现老人偶尔忘记服药，建议家属把药盒放在餐桌显眼位置，并每日电话提醒一次。',
      severity: 'medium',
      status: 'following',
      createdBy: 'cg-1',
      createdAt: `${daysFromNow(-2)}T09:35:00.000Z`,
    },
    {
      id: 'obs-2',
      elderId: 'elder-2',
      checkId: 'check-2',
      type: 'mixed_meds',
      clinicalNote:
        '处方药与成分不明的保健品混放，存在相互作用及重复用药风险，需药师评估合并用药安全性。',
      familySuggestion:
        '发现药盒里混放了其他保健品，建议家属把处方药单独存放，购买保健品前先咨询医生或药师。',
      severity: 'high',
      status: 'open',
      createdBy: 'cg-2',
      createdAt: `${daysFromNow(-1)}T10:15:00.000Z`,
    },
  ];
}

export function seedReminders(): RefillReminder[] {
  return [];
}
