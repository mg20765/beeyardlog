import { useState } from "react";
import "./App.css";
import Header from "./NavBar/Header.jsx";
import HiveDetailsSection from "./components/HiveDetailsSection.jsx";
import WeatherSection from "./components/WeatherSection.jsx";
import ConditionSection from "./components/ConditionSection.jsx";
import MiteCheckSection from "./components/MiteCheckSection.jsx";
import TreatmentsSection from "./components/TreatmentsSection.jsx";
import FeedingSection from "./components/FeedingSection.jsx";
import AdditionsSection from "./components/AdditionsSection.jsx";
import FoodStoresSection from "./components/FoodStoresSection.jsx";
import ExtractionSection from "./components/ExtractionSection.jsx";
import NotesSection from "./components/NotesSection.jsx";
import InspectionLog from "./components/InspectionLog.jsx";
import HiveStatusList from "./components/HiveStatusList.jsx";
import GearList from "./components/GearList.jsx";
import ExpiryDates, { ExpiryBanner } from "./components/ExpiryDates.jsx";
import ViewTabs from "./components/ViewTabs.jsx";
import { loadExpiry, saveExpiry } from "./utils/expiry.js";
import {
  hiveStatuses,
  overdueCount,
  loadLimitDays,
  saveLimitDays,
} from "./utils/hiveStatus.js";
import { todayLocal } from "./utils/date.js";
import ActionButtons from "./components/ActionButtons.jsx";
import BackupReminder from "./components/BackupReminder.jsx";
import DraftNotice from "./components/DraftNotice.jsx";
import MissingFieldsWarning from "./components/MissingFieldsWarning.jsx";
import InputProblems from "./components/InputProblems.jsx";
import { ProblemsContext } from "./components/problemsContext.js";
import useHiveLog from "./hooks/useHiveLog.js";

export default function HiveLogbook() {
  const {
    form,
    log,
    loading,
    justSaved,
    importMessage,
    hiveIdError,
    missingFields,
    inputProblems,
    goToField,
    needsBackupReminder,
    entriesSinceBackup,
    correctionsSinceBackup,
    set,
    setCheck,
    addToLog,
    confirmAddAnyway,
    dismissMissingFields,
    draftRestored,
    discardDraft,
    deleteEntry,
    updateEntry,
    clearLog,
    exportAll,
    backupToFile,
    restoreFromFile,
  } = useHiveLog();

  // Expiry dates (EpiPen and other items), kept on the phone. Shared by the
  // warning at the top, the expiry list and the gear list.
  const [expiry, setExpiry] = useState(loadExpiry);
  const changeExpiry = (next) => {
    setExpiry(next);
    saveExpiry(next);
  };

  // How long before an unchecked hive counts as overdue. Kept here so the Hives
  // button can show how many are overdue while another view is open.
  const [limit, setLimit] = useState(loadLimitDays);
  const changeLimit = (days) => {
    setLimit(days);
    saveLimitDays(days);
  };
  const overdue = overdueCount(hiveStatuses(log, todayLocal(), limit));

  // Which view the page shows. It opens on the form.
  const [view, setView] = useState("log");

  // field name -> message, so each field can show its own problem.
  const problemByField = Object.fromEntries(
    (inputProblems ?? []).map((p) => [p.field, p.message]),
  );

  return (
    <div className="hive-app">
      <Header justSaved={justSaved} />

      <ExpiryBanner expiry={expiry} />

      <ViewTabs view={view} onChange={setView} overdue={overdue} />

      {view === "hives" && (
        <HiveStatusList log={log} limit={limit} onLimitChange={changeLimit} />
      )}

      {view === "gear" && (
        <>
          <ExpiryDates expiry={expiry} onChange={changeExpiry} />
          <GearList epipen={expiry.epipen.has} />
        </>
      )}

      {view === "log" && (
        <>
          <DraftNotice visible={draftRestored} onDiscard={discardDraft} />

          <ProblemsContext.Provider value={problemByField}>
            <HiveDetailsSection
              form={form}
              set={set}
              hiveIdError={hiveIdError}
            />
            <WeatherSection form={form} set={set} />
            <ConditionSection form={form} set={set} />
            <MiteCheckSection form={form} set={set} setCheck={setCheck} />
            <TreatmentsSection form={form} set={set} setCheck={setCheck} />
            <FeedingSection form={form} set={set} setCheck={setCheck} />
            <AdditionsSection form={form} set={set} setCheck={setCheck} />
            <FoodStoresSection form={form} set={set} />
            <ExtractionSection form={form} set={set} />
            <NotesSection form={form} set={set} />
          </ProblemsContext.Provider>

          <InputProblems problems={inputProblems} onGoTo={goToField} />

          <MissingFieldsWarning
            fields={missingFields}
            onAddAnyway={confirmAddAnyway}
            onGoBack={dismissMissingFields}
          />

          <BackupReminder
            visible={needsBackupReminder}
            count={entriesSinceBackup}
            corrections={correctionsSinceBackup}
            onBackup={backupToFile}
          />

          <ActionButtons
            onAdd={addToLog}
            onExport={exportAll}
            onClear={clearLog}
            onBackup={backupToFile}
            onRestoreFile={restoreFromFile}
            exportDisabled={log.length === 0}
            backupDisabled={log.length === 0}
            count={log.length}
            importMessage={importMessage}
          />

          <InspectionLog
            log={log}
            loading={loading}
            deleteEntry={deleteEntry}
            updateEntry={updateEntry}
          />
        </>
      )}
    </div>
  );
}
