CREATE PROCEDURE [dbo].[SP_GetFlights]
    @FlightDate DATE = NULL,
    @ArrDep CHAR(1) = NULL,
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        F.FlightId,
        F.SourceFlightId,
        F.FlightNo,
        F.FlightDate,
        F.ArrDep,
        F.Route,
        F.Airline,
        F.Status,
        F.ScheduledTime,
        F.EstimatedTime,
        F.ActualTime,
        F.Gate,
        F.CheckInIsland,
        F.CheckInCounterSpec,
        F.Belt,
        F.IsSimulatedCheckIn,
        F.IsSimulatedGate,
        F.IsSimulatedBelt,
        F.CreatedAt,
        F.UpdatedAt
    FROM dbo.Flight F
    WHERE (@FlightDate IS NULL OR F.FlightDate = @FlightDate)
      AND (@ArrDep IS NULL OR F.ArrDep = @ArrDep)
      AND (
            @Search IS NULL
         OR F.FlightNo LIKE N'%' + @Search + N'%'
         OR F.Route LIKE N'%' + @Search + N'%'
      )
    ORDER BY
        F.FlightDate DESC,
        COALESCE(F.ScheduledTime, F.EstimatedTime, F.ActualTime) DESC,
        F.FlightNo ASC;
END
GO
/****** Object:  StoredProcedure [dbo].[SP_ImportRawFromACISPDIN]    Script Date: 5/11/2026 8:16:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* -------------------------------------------------------------
