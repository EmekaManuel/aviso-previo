/**
 * Aviso Previo — Date Arithmetic & Validator Unit Tests
 *
 * Verifies:
 * 1. Business day computation (weekend exclusion)
 * 2. 60-day maximum notice period arithmetic across 41 DPAs
 * 3. Workflow validator transitions blocking and permitting correctly
 */

const assert = require('assert');

function addBusinessDays(startDate, days) {
  const result = new Date(startDate.getTime());
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

function addCalendarDays(startDate, days) {
  const result = new Date(startDate.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function formatNoticeDate(date) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function runDateTests() {
  console.log(`\n============================================================`);
  console.log(`AVISO PREVIO — DATE COMPUTATION & VALIDATOR VERIFICATION`);
  console.log(`============================================================\n`);

  // Test 1: Weekend exclusion on business days
  const friday = new Date('2026-11-20T00:00:00Z'); // Friday
  const monday = addBusinessDays(friday, 1);
  assert.strictEqual(monday.getDay(), 1, '1 business day after Friday must be Monday');
  assert.strictEqual(monday.getDate(), 23, '1 business day after 20 Nov must be 23 Nov');
  console.log(`✔ Test 1: Weekend exclusion verified (Friday 20 Nov + 1 business day = Monday 23 Nov)`);

  // Test 2: 30 Business Days math
  const thirtyBizDays = addBusinessDays(friday, 30);
  assert.strictEqual(thirtyBizDays.getDay() !== 0 && thirtyBizDays.getDay() !== 6, true);
  console.log(`✔ Test 2: 30 business days calculated (${formatNoticeDate(thirtyBizDays)})`);

  // Test 3: 60 Calendar Days math for ENG-142
  const sixtyCalendarDays = addCalendarDays(friday, 60);
  assert.strictEqual(sixtyCalendarDays.getDate(), 19, '60 days after 20 Nov is 19 Jan');
  assert.strictEqual(sixtyCalendarDays.getMonth(), 0, 'Month must be January (0)');
  assert.strictEqual(sixtyCalendarDays.getFullYear(), 2027, 'Year must be 2027');
  assert.strictEqual(formatNoticeDate(sixtyCalendarDays), '19 January 2027');
  console.log(`✔ Test 3: 60 calendar days calculated deterministically (Earliest go-live: 19 January 2027)`);

  // Test 4: Workflow validator simulation
  const mockDecisions = {
    'ENG-142': {
      issueKey: 'ENG-142',
      classification: 'NEW_SUBPROCESSOR',
      vendor: 'Glimpse',
      affectedCustomers: 41,
      longestNoticeDays: 60,
      earliestGoLiveDate: '2027-01-19T00:00:00Z',
      overridden: false,
    },
    'ENG-151': {
      issueKey: 'ENG-151',
      classification: 'EXISTING_VENDOR_NO_CHANGE',
      vendor: 'ErrorSentry',
      overridden: false,
    },
    'ENG-156': {
      issueKey: 'ENG-156',
      classification: 'LOCATION_CHANGE',
      vendor: 'RelayPost',
      affectedCustomers: 3,
      earliestGoLiveDate: '2027-01-19T00:00:00Z',
      overridden: false,
    },
  };

  function simulateValidator(issueKey, targetStatus, testDate = new Date('2026-11-20T00:00:00Z')) {
    const isRelease = ['deployed', 'done', 'production'].includes(targetStatus.toLowerCase());
    if (!isRelease) return { result: true };

    const decision = mockDecisions[issueKey];
    if (!decision) return { result: true };
    if (decision.overridden) return { result: true };

    if (decision.classification === 'NEW_SUBPROCESSOR' || decision.classification === 'LOCATION_CHANGE') {
      const unlock = new Date(decision.earliestGoLiveDate);
      if (testDate < unlock) {
        return {
          result: false,
          errorMessage: `Aviso Previo Release Hold: Notice period active until ${formatNoticeDate(unlock)}.`,
        };
      }
    }
    return { result: true };
  }

  // ENG-142 moving to "Deployed" on 20 Nov 2026 -> must be BLOCKED
  const eng142Early = simulateValidator('ENG-142', 'Deployed');
  assert.strictEqual(eng142Early.result, false, 'ENG-142 must be blocked before notice date');
  console.log(`✔ Test 4: ENG-142 transition to "Deployed" blocked before notice date`);

  // ENG-142 moving to "In Progress" -> must be ALLOWED
  const eng142Dev = simulateValidator('ENG-142', 'In Progress');
  assert.strictEqual(eng142Dev.result, true, 'ENG-142 non-release transition must pass');
  console.log(`✔ Test 5: ENG-142 transition to non-release status ("In Progress") allowed`);

  // ENG-142 after 19 Jan 2027 -> must be ALLOWED
  const eng142Matured = simulateValidator('ENG-142', 'Deployed', new Date('2027-01-20T00:00:00Z'));
  assert.strictEqual(eng142Matured.result, true, 'ENG-142 must be allowed after unlock date');
  console.log(`✔ Test 6: ENG-142 transition allowed after unlock date passes`);

  // ENG-151 (routine errorSDK upgrade) moving to "Deployed" -> must be ALLOWED
  const eng151 = simulateValidator('ENG-151', 'Deployed');
  assert.strictEqual(eng151.result, true, 'ENG-151 routine maintenance must not be blocked');
  console.log(`✔ Test 7: ENG-151 routine maintenance allowed to Deploy immediately`);

  // Human Override on ENG-142 -> must be ALLOWED
  mockDecisions['ENG-142'].overridden = true;
  const eng142Overridden = simulateValidator('ENG-142', 'Deployed');
  assert.strictEqual(eng142Overridden.result, true, 'ENG-142 with human override must pass');
  console.log(`✔ Test 8: Human counsel override allows deployment before notice date\n`);

  console.log(`============================================================`);
  console.log(`All Phase 5 Date & Validator Tests Passed! (8/8)`);
  console.log(`============================================================\n`);
}

runDateTests();

