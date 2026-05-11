CREATE PROCEDURE [dbo].[SP_NormalizeFlightOperationalData]
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH InfoBase AS (
        SELECT
            FIR.SourceFlightId,
            LFI.ShortName,
            FIR.InfoValue
        FROM dbo.FlightInfoRaw FIR
        INNER JOIN dbo.ListFlightInfoRaw LFI ON LFI.ListFlightInfoId = FIR.ListFlightInfoId
    ),
    GateInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('DGATE', 'AGATE', 'Gate') THEN IB.InfoValue END) AS GateValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    BeltInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName = 'Belt' THEN IB.InfoValue END) AS BeltValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    StatusInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('Status', 'FLST') THEN IB.InfoValue END) AS StatusValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    ScheduledInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('SOBT', 'STD', 'STA', 'ScheduledTime') THEN IB.InfoValue END) AS ScheduledValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    EstimatedInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('ETOT', 'ETD', 'ETA', 'EstimatedTime') THEN IB.InfoValue END) AS EstimatedValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    ActualInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('ATOT', 'ATD', 'ATA', 'ALDT', 'ActualTime') THEN IB.InfoValue END) AS ActualValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    CheckInInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName = 'CkiRow' THEN IB.InfoValue END) AS CkiRow
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    )
    UPDATE F
    SET
        F.Gate = CASE
            WHEN G.GateValue IS NULL THEN NULL
            ELSE dbo.fn_ExtractFirstInt(G.GateValue)
        END,
        F.Belt = CASE
            WHEN B.BeltValue IS NULL THEN NULL
            ELSE dbo.fn_ExtractFirstInt(B.BeltValue)
        END,
        F.Status = NULLIF(LTRIM(RTRIM(S.StatusValue)), ''),
        F.ScheduledTime = COALESCE(TRY_CONVERT(TIME, Sch.ScheduledValue), F.ScheduledTime),
        F.EstimatedTime = TRY_CONVERT(TIME, Est.EstimatedValue),
        F.ActualTime = TRY_CONVERT(TIME, Act.ActualValue),
        F.CheckInIsland = X.CheckInIsland,
        F.CheckInCounterSpec = X.CheckInCounterSpec,
        F.IsSimulatedCheckIn = CASE WHEN X.CheckInCounterSpec IS NULL THEN 0 ELSE 1 END,
        F.UpdatedAt = SYSDATETIME()
    FROM dbo.Flight F
    LEFT JOIN GateInfo G ON G.SourceFlightId = F.SourceFlightId
    LEFT JOIN BeltInfo B ON B.SourceFlightId = F.SourceFlightId
    LEFT JOIN StatusInfo S ON S.SourceFlightId = F.SourceFlightId
    LEFT JOIN ScheduledInfo Sch ON Sch.SourceFlightId = F.SourceFlightId
    LEFT JOIN EstimatedInfo Est ON Est.SourceFlightId = F.SourceFlightId
    LEFT JOIN ActualInfo Act ON Act.SourceFlightId = F.SourceFlightId
    LEFT JOIN CheckInInfo C ON C.SourceFlightId = F.SourceFlightId
    OUTER APPLY (
        SELECT
            I.CheckInIsland,
            dbo.fn_BuildContiguousCounterSpec(StartNo, CounterCount) AS CheckInCounterSpec
        FROM (
            SELECT TOP (1)
                MI.CheckInIsland,
                CASE
                    WHEN Parsed.CounterCount IS NULL OR Parsed.CounterCount < 2 THEN
                        CASE
                            WHEN (MI.MaxCounter - MI.MinCounter + 1) <= 2 THEN (MI.MaxCounter - MI.MinCounter + 1)
                            ELSE
                                2 + (
                                    ABS(CHECKSUM(CONCAT(F.FlightNo, '|', CONVERT(NVARCHAR(10), F.FlightDate, 120), '|', MI.CheckInIsland, '|CKI_COUNT')))
                                    % CASE
                                        WHEN (MI.MaxCounter - MI.MinCounter + 1) >= 8 THEN 7
                                        ELSE (MI.MaxCounter - MI.MinCounter)
                                      END
                                )
                        END
                    WHEN Parsed.CounterCount > (MI.MaxCounter - MI.MinCounter + 1) THEN (MI.MaxCounter - MI.MinCounter + 1)
                    ELSE Parsed.CounterCount
                END AS CounterCount,
                MI.MinCounter + (
                    ABS(CHECKSUM(CONCAT(F.FlightNo, '|', CONVERT(NVARCHAR(10), F.FlightDate, 120), '|', MI.CheckInIsland)))
                    % (
                        (MI.MaxCounter - MI.MinCounter + 1) -
                        CASE
                            WHEN Parsed.CounterCount IS NULL OR Parsed.CounterCount < 2 THEN
                                CASE
                                    WHEN (MI.MaxCounter - MI.MinCounter + 1) <= 2 THEN (MI.MaxCounter - MI.MinCounter + 1)
                                    ELSE
                                        2 + (
                                            ABS(CHECKSUM(CONCAT(F.FlightNo, '|', CONVERT(NVARCHAR(10), F.FlightDate, 120), '|', MI.CheckInIsland, '|CKI_COUNT')))
                                            % CASE
                                                WHEN (MI.MaxCounter - MI.MinCounter + 1) >= 8 THEN 7
                                                ELSE (MI.MaxCounter - MI.MinCounter)
                                              END
                                        )
                                END
                            WHEN Parsed.CounterCount > (MI.MaxCounter - MI.MinCounter + 1) THEN (MI.MaxCounter - MI.MinCounter + 1)
                            ELSE Parsed.CounterCount
                        END + 1
                    )
                ) AS StartNo
            FROM dbo.MasterCheckInIsland MI
            CROSS APPLY (
                SELECT COUNT(*) AS CounterCount
                FROM dbo.fn_ParseCounterSpec(dbo.fn_NormalizeCounterSpec(C.CkiRow))
            ) Parsed
            ORDER BY ABS(CHECKSUM(CONCAT(F.FlightNo, '|', CONVERT(NVARCHAR(10), F.FlightDate, 120), '|', MI.CheckInIsland)))
        ) I
    ) X;

    UPDATE F
    SET IsSimulatedGate = CASE WHEN F.Gate IS NULL THEN 1 ELSE 0 END
    FROM dbo.Flight F;

    UPDATE F
    SET IsSimulatedBelt = CASE WHEN F.Belt IS NULL THEN 1 ELSE 0 END
    FROM dbo.Flight F;

    UPDATE F
    SET Gate = ((ABS(CHECKSUM(CONCAT(F.FlightNo, '|', F.FlightDate, '|G'))) % 49) + 1)
    FROM dbo.Flight F
    WHERE F.Gate IS NULL;

    UPDATE F
    SET Belt = ((ABS(CHECKSUM(CONCAT(F.FlightNo, '|', F.FlightDate, '|B'))) % 16) + 1)
    FROM dbo.Flight F
    WHERE F.ArrDep = 'A'
      AND F.Belt IS NULL;

    UPDATE F
    SET
        F.Status = CASE
            WHEN F.ArrDep = 'D' THEN
                CASE ABS(CHECKSUM(CONCAT(F.FlightNo, '|', CONVERT(NVARCHAR(10), F.FlightDate, 120), '|STATUS')))
                    % 6
                    WHEN 0 THEN N'CHECKIN_OPEN'
                    WHEN 1 THEN N'BOARDING'
                    WHEN 2 THEN N'DELAYED'
                    WHEN 3 THEN N'CLOSED'
                    WHEN 4 THEN N'DEPARTED'
                    ELSE N'CHECKIN_OPEN'
                END
            ELSE
                CASE ABS(CHECKSUM(CONCAT(F.FlightNo, '|', CONVERT(NVARCHAR(10), F.FlightDate, 120), '|STATUS')))
                    % 5
                    WHEN 0 THEN N'ARRIVED'
                    WHEN 1 THEN N'BAGGAGE_LOADING'
                    WHEN 2 THEN N'BAGGAGE_DONE'
                    WHEN 3 THEN N'DELAYED'
                    ELSE CASE WHEN F.Belt IS NOT NULL THEN N'BAGGAGE_LOADING' ELSE N'ARRIVED' END
                END
        END
    FROM dbo.Flight F
    WHERE F.Status IS NULL
       OR LTRIM(RTRIM(F.Status)) = N'';
END
GO
/****** Object:  StoredProcedure [dbo].[SP_SeedLongThanhMasters]    Script Date: 5/11/2026 8:16:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* -------------------------------------------------------------
   Seed procedure for Long Thanh masters
------------------------------------------------------------- */
CREATE PROCEDURE [dbo].[SP_SeedLongThanhMasters]
AS
