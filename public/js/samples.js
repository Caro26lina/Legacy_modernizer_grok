

/* eslint-disable */
window.SAMPLES = {
  cobol: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. CALCULATE-INTEREST.
      * WRITTEN BY: R.SHARMA 1987
      * THIS ROUTINE CALCULATES COMPOUND INTEREST
      * NOTE: TAX EXEMPTION LOGIC BELOW IS OUTDATED - IGNORE
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-PRINCIPAL     PIC 9(9)V99.
       01 WS-RATE          PIC 9(3)V9999.
       01 WS-YEARS         PIC 9(3).
       01 WS-RESULT        PIC 9(12)V99.
       01 WS-TEMP          PIC 9(12)V99.
      * DEAD CODE - NO LONGER USED
       01 WS-OLD-TAX-RATE  PIC 9(3)V99 VALUE 0.30.
       01 WS-OBSOLETE-FLAG PIC X VALUE 'N'.
       PROCEDURE DIVISION.
       MAIN-PARA.
           MOVE 10000.00  TO WS-PRINCIPAL
           MOVE 0.0875    TO WS-RATE
           MOVE 5         TO WS-YEARS
           PERFORM CALC-COMPOUND
           DISPLAY "RESULT: " WS-RESULT
           STOP RUN.
      * DEAD BRANCH - NEVER REACHED SINCE 1995
       OLD-TAX-CALC.
           MULTIPLY WS-RESULT BY WS-OLD-TAX-RATE GIVING WS-TEMP.
       CALC-COMPOUND.
           COMPUTE WS-RESULT = WS-PRINCIPAL *
               (1 + WS-RATE) ** WS-YEARS.`,

  java: `// LegacyPaymentProcessor.java - circa 2003
// TODO: refactor this mess someday
public class LegacyPaymentProcessor {
    // HACK: magic number from old mainframe
    private static final double TAX_RATE = 0.18;
    // UNUSED - kept for backwards compat
    @Deprecated
    private String legacyId;

    public double processPayment(double amount, String custType) {
        double result = 0;
        // old logic - custType B not used anymore
        if (custType.equals("A")) {
            result = amount * (1 - TAX_RATE);
        } else if (custType.equals("B")) {
            // dead branch
            result = amount * 0.75;
        } else {
            result = amount;
        }
        // manual rounding from pre-BigDecimal era
        result = Math.round(result * 100.0) / 100.0;
        return result;
    }
    // never called
    private void oldAuditLog(String msg) {
        System.out.println("[AUDIT 2003]: " + msg);
    }
}`,

  doc: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. CALC-LOAN-EMI.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-PRINCIPAL   PIC 9(9)V99.
       01 WS-ANNUAL-RATE PIC 9(3)V9999.
       01 WS-MONTHS      PIC 9(3).
       01 WS-EMI         PIC 9(9)V99.
       PROCEDURE DIVISION.
           MOVE 500000.00 TO WS-PRINCIPAL
           MOVE 0.0875    TO WS-ANNUAL-RATE
           MOVE 120       TO WS-MONTHS
           PERFORM CALC-EMI.
       CALC-EMI.
           COMPUTE WS-EMI = WS-PRINCIPAL *
             (WS-ANNUAL-RATE / 12) *
             (1 + WS-ANNUAL-RATE / 12) ** WS-MONTHS /
             ((1 + WS-ANNUAL-RATE / 12) ** WS-MONTHS - 1).`,
};
