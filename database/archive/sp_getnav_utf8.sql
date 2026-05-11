CREATE PROCEDURE [dbo].[SP_GetFlightNavigationTargets]
    @FlightId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        F.FlightId,
        F.Gate,
        F.CheckInIsland,
        F.CheckInCounterSpec,
        F.Belt
    FROM dbo.Flight F
    WHERE F.FlightId = @FlightId;

    SELECT
        FC.FlightId,
        FC.CheckInIsland,
        FC.CounterNo
    FROM dbo.FlightCheckInCounter FC
    WHERE FC.FlightId = @FlightId
    ORDER BY FC.CounterNo;
END
GO
/****** Object:  StoredProcedure [dbo].[SP_GetFlights]    Script Date: 5/11/2026 8:16:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* -------------------------------------------------------------
   Runtime procedures for backend APIs
------------------------------------------------------------- */
CREATE PROCEDURE [dbo].[SP_GetFlights]
    @FlightDate DATE = NULL,
