	[IsQuantity] [bit] NULL,
	[IsFIDS] [bit] NULL,
	[IsACDM] [bit] NULL,
	[IsAODB] [bit] NULL,
 CONSTRAINT [PK_ListFlightInfo] PRIMARY KEY CLUSTERED 
(
	[ListFlightInfoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ACDMTime]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ACDMTime](
	[ACDMTimeId] [varchar](20) NOT NULL,
	[FlightInfo] [varchar](20) NULL,
	[ArrDep] [varchar](1) NULL,
	[Description] [nvarchar](500) NULL,
	[OrderBy] [int] NULL,
	[UseSourceName] [int] NULL,
 CONSTRAINT [PK_ACDMTime] PRIMARY KEY CLUSTERED 
(
	[ACDMTimeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_FlightField]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


	CREATE VIEW [dbo].[vw_FlightField] WITH SCHEMABINDING
	as
	SELECT DISTINCT lfi.ListFlightInfoId,
	       CASE 
	            WHEN ISNULL(a.UseSourceName, 0) = 1 THEN lfi.ShortName
	            ELSE ISNULL(a.ACDMTimeId, lfi.ShortName)
	       END                 AS [FieldName],ISNULL (a.ArrDep, lfi.ArrDep) AS ArrDep,
	       lfi.[Description],lfi.ShortName,lfi.SourceNameMap,lfi.IsTime,
	       lfi.OrderBy
	FROM   dbo.ListFlightInfo      AS lfi
	       LEFT JOIN dbo.ACDMTime  AS a
	            ON  (a.ArrDep = lfi.ArrDep OR lfi.ArrDep IS NULL)
	            AND a.FlightInfo = lfi.ShortName
	WHERE lfi.IsUse=1
GO
/****** Object:  Table [dbo].[ListTime]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ListTime](
	[ListTimeId] [int] IDENTITY(1,1) NOT NULL,
	[TimeSTR] [varchar](5) NULL,
	[TimeUTC] [varchar](5) NULL,
	[TimeLocal] [varchar](5) NULL,
	[TimeMinute] [int] NULL,
	[TimeFIDS] [varchar](5) NULL,
	[TimeFIDSBlock5UP] [varchar](5) NULL,
	[TimeFIDSBlock5DOWN] [varchar](5) NULL,
 CONSTRAINT [PK_TimeStr] PRIMARY KEY CLUSTERED 
(
	[ListTimeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FlightStatus]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FlightStatus](
	[FlightStatusId] [int] IDENTITY(1,1) NOT NULL,
	[FlightStatusName] [varchar](3) NULL,
	[FieldName] [varchar](10) NULL,
	[Domestic] [int] NULL,
	[International] [int] NULL,
	[Sortby] [int] NULL,
	[Remarks] [nvarchar](250) NULL,
 CONSTRAINT [PK_FlightStatus] PRIMARY KEY CLUSTERED 
(
	[FlightStatusId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Route]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Route](
	[RouteId] [varchar](50) NOT NULL,
	[RouteType] [varchar](1) NULL,
	[Distance] [int] NULL,
	[Country] [varchar](2) NULL,
 CONSTRAINT [PK_Route] PRIMARY KEY CLUSTERED 
(
	[RouteId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_FlightStatus]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE VIEW [dbo].[vw_FlightStatus]
AS
SELECT f.FlightId,
-- CASE WHEN ISNULL (fi.InfoValue,'')<>'' THEN fi.InfoValue ELSE 
-- CASE WHEN f.FlightDate<CAST(DATEADD(DAY,-2,GETDATE()) AS DATE) THEN 'DEP' ELSE
-- CASE WHEN f.FlightDate>CAST(DATEADD(DAY,2,GETDATE()) AS DATE) THEN 'SCH' ELSE
-- ISNULL(fs.FlightStatusName,'') END                  
--            END END AS FlightStatusName 
[FlightStatusName] =[dbo].[fn_calflightstatus](f.FlightDate,f.ArrDep,fi.InfoValue,fs.FlightStatusName)  
FROM dbo.Flight AS f WITH (NOLOCK) 
LEFT JOIN dbo.FlightInfo AS fi WITH (NOLOCK) ON fi.FlightId = f.FlightId AND fi.ListFlightInfoId=1
LEFT JOIN (SELECT c.FlightId, MAX(c.FlightStatusName) AS FlightStatusName
FROM   (
           SELECT b.FlightId,
                  b.FlightStatusName,
                  b.Sortby,
                  b.MileStone,
                  RANK() OVER(PARTITION BY B.FlightId ORDER BY B.Sortby DESC) AS Rank1
           FROM   (
                      SELECT f.FlightId,
                             ISNULL(A.FlightStatusName, 'SCH') AS FlightStatusName,
                             ISNULL(A.Sortby, 0) AS Sortby,
                             DATEADD(
                                 minute,
                                 CAST(
                                     (
                                         lt.TimeMinute + CASE 
                                                              WHEN ISNULL(r.RouteType, 'I')
                                                                   = 'D' THEN a.Domestic
                                                              ELSE a.International
                                                         END
                                     ) AS INT
                                 ),
                                 CAST(f.FlightDate AS DATETIME)
                             )           AS MileStone
                      FROM   dbo.FlightInfo  AS fi WITH (NOLOCK) 
                             LEFT JOIN dbo.Flight AS f WITH (NOLOCK) 
                                  ON  f.FlightId = fi.FlightId
                             LEFT JOIN (
                                      SELECT vff.ListFlightInfoId,
                                             vff.FieldName,
                                             vff.ArrDep,
                                             fs.FlightStatusName,
                                             fs.Domestic,
                                             fs.International,
                                             fs.Sortby
                                      FROM   dbo.vw_FlightField AS vff
                                             LEFT JOIN dbo.FlightStatus fs
                                                  ON  fs.FieldName = vff.FieldName
                                      WHERE  fs.FlightStatusId > 0
                                  ) A
                                  ON  A.ListFlightInfoId = fi.ListFlightInfoId AND A.ArrDep = f.ArrDep
                             LEFT JOIN dbo.ListTime AS lt WITH (NOLOCK)
                                  ON  lt.TimeSTR = fi.InfoValue                             
                             LEFT JOIN dbo.[Route] AS r WITH (NOLOCK)
                                  ON  r.RouteId = f.[Route]
                      WHERE  lt.TimeMinute IS NOT NULL AND f.FlightDate BETWEEN DATEADD(DAY,-2,GETDATE()) AND DATEADD(DAY,2,GETDATE())
                  ) B
           WHERE  B.MileStone < GETDATE()
                  AND b.Sortby IS NOT NULL
       ) c
WHERE  c.Rank1 = 1
GROUP BY c.FlightId
) AS fs ON fs.FlightId = f.FlightId
where f.FlightDate between CAST(DATEADD(DAY,-5,GETDATE()) AS DATE) and CAST(DATEADD(DAY,5,GETDATE()) AS DATE)

GO
/****** Object:  Table [dbo].[ParkingBay]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ParkingBay](
	[ParkingBay] [varchar](10) NOT NULL,
	[Lat] [decimal](9, 6) NULL,
	[Long] [decimal](9, 6) NULL,
	[Range] [decimal](5, 2) NULL,
	[Lat2] [decimal](9, 6) NULL,
	[Long2] [decimal](9, 6) NULL,
	[Remarks] [nvarchar](500) NULL,
	[Status] [bit] NULL,
	[ZonePark] [int] NULL,
	[ListParkingBayType] [varchar](30) NULL,
	[IsACV] [bit] NULL,
	[Alert] [int] NULL,
	[ZoneAOC] [int] NULL,
	[OrderNo] [int] NULL,
	[Weight] [int] NULL,
	[IsAPU] [bit] NULL,
	[IsVDGS] [bit] NULL,
	[Gate] [varchar](50) NULL,
	[Track] [varchar](10) NULL,
	[Lat3] [decimal](9, 6) NULL,
	[Long3] [decimal](9, 6) NULL,
	[Terminal] [varchar](50) NULL,
	[Note] [nvarchar](1000) NULL,
	[VDGSACType] [varchar](500) NULL,
 CONSTRAINT [PK_ParkingBay] PRIMARY KEY CLUSTERED 
(
	[ParkingBay] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ListAcType]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ListAcType](
	[ListAcTypeId] [int] IDENTITY(1,1) NOT NULL,
	[Code] [varchar](20) NULL,
	[IATACode] [varchar](20) NULL,
	[Description] [varchar](100) NULL,
	[PaxCap] [int] NULL,
	[Maxspeed] [int] NULL,
	[Class] [varchar](1) NULL,
	[Wake] [varchar](5) NULL,
	[Enginethrust] [int] NULL,
	[Length] [decimal](18, 2) NULL,
	[Wingspan] [decimal](18, 2) NULL,
	[TailHeight] [decimal](18, 2) NULL,
	[AirCraftType] [varchar](20) NULL,
	[CodeBay] [varchar](3) NULL,
	[Weight] [int] NULL,
	[Synonyms] [varchar](500) NULL
) ON [PRIMARY]
GO
/****** Object:  Index [PK_ACTypeId]    Script Date: 5/5/2026 12:20:41 PM ******/
CREATE CLUSTERED INDEX [PK_ACTypeId] ON [dbo].[ListAcType]
(
	[ListAcTypeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_ParkingBay]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE   VIEW [dbo].[vw_ParkingBay]
as 
SELECT A.PRK,A.ArrDep, A.StandDateTime, A.FlightNo, A.FlightId, A.FlightDate,
       A.[Route], A.LinkFlight, A.LinkFlightId, A.ACRegNo, A.ACType, A.[Weight],A.PRKWeight,A.IsAPU,A.IsVip,A.PRKAPU,A.AD,
[Rank0]=DENSE_RANK() OVER(PARTITION BY A.PRK ORDER BY A.StandDateTime)-1,
[Rank1]=DENSE_RANK() OVER(PARTITION BY A.PRK ORDER BY A.StandDateTime),
[Rank2]=DENSE_RANK() OVER(PARTITION BY A.PRK ORDER BY A.StandDateTime)+1
  FROM (
SELECT 
[PRK]=dbo.fn_getParkingBay(fi.InfoValue),
[PRKWeight]=pb.[Weight],
[PRKAPU]=pb.IsAPU,
[ArrDep]=f.ArrDep,
[AD]=f.ArrDep,
[StandDateTime]=f.StandDateTime,
[FlightNo]=f.FlightNo,
[FlightId]=f.FlightId,
[FlightDate]=f.FlightDate,
[Route]=f.[Route],
[LinkFlightId]=ISNULL(CASE WHEN f.[LinkFlight] LIKE '0|%' THEN 0 ELSE try_cast(REPLACE(REPLACE(REPLACE(LinkFlight,CAST(f.FlightId AS VARCHAR(12)),''),'*',''),'|','') AS INT) END,0),
[LinkFlight]=f.LinkFlight,
[ACRegNo]=f1.InfoValue,
[ACType]=f2.InfoValue,
[Weight]=ac.[Weight],
[IsAPU]=f4.InfoValue,
[IsVip]=f5.InfoValue
FROM dbo.FlightInfo AS fi WITH (NOLOCK) 
LEFT JOIN dbo.Flight AS f WITH (NOLOCK) ON f.FlightId = fi.FlightId
LEFT JOIN dbo.FlightInfo AS f1 WITH (NOLOCK) ON f1.FlightId = f.FlightId AND f1.ListFlightInfoId=3--ACRegNo
LEFT JOIN dbo.FlightInfo AS f2 WITH (NOLOCK) ON f2.FlightId = f.FlightId AND f2.ListFlightInfoId=6--ACType
LEFT JOIN dbo.FlightInfo AS f4 WITH (NOLOCK) ON f4.FlightId = f.FlightId AND f4.ListFlightInfoId=101--IsAPU
LEFT JOIN dbo.FlightInfo AS f5 WITH (NOLOCK) ON f5.FlightId = f.FlightId AND f5.ListFlightInfoId=102--IsVIp
LEFT JOIN dbo.ListACType AS ac WITH (NOLOCK) ON ac.Code = f2.InfoValue --- ACType Weight
LEFT JOIN dbo.ParkingBay AS pb WITH (NOLOCK) ON pb.ParkingBay = dbo.fn_getParkingBay(fi.InfoValue)
WHERE fi.ListFlightInfoId=15 AND ISNULL(fi.InfoValue,'')<>'' AND ISNULL (f.[Status],0)=1 AND ISNULL(f.StandDateTime,'')<>''
AND f.StandDateTime between DATEADD(HOUR,-7,CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND DATEADD(HOUR,32,CAST(CAST(GETDATE() AS DATE) AS DATETIME))
UNION ALL
SELECT 
[PRK]=dbo.fn_getParkingBay(fi.InfoValue),
[PRKWeight]=pb.[Weight],
[PRKAPU]=pb.IsAPU,
[ArrDep]=CASE WHEN f.ArrDep='A' THEN 'D' ELSE 'A' END,
[AD]=f.ArrDep,
[StandDateTime]=try_cast(f3.InfoValue AS DATETIME),
[FlightNo]=f.FlightNo,
[FlightId]=f.FlightId,
[FlightDate]=f.FlightDate,
[Route]=f.[Route],
[LinkFlightId]=ISNULL(CASE WHEN f.[LinkFlight] LIKE '0|%' THEN 0 ELSE try_cast(REPLACE(REPLACE(REPLACE(LinkFlight,CAST(f.FlightId AS VARCHAR(12)),''),'*',''),'|','') AS INT) END,0),
[LinkFlight]=f.LinkFlight,
[ACRegNo]=f1.InfoValue,
[ACType]=f2.InfoValue,
[Weight]=ac.[Weight],
[IsAPU]=f4.InfoValue,
[IsVip]=f5.InfoValue
FROM dbo.FlightInfo AS fi WITH (NOLOCK) 
LEFT JOIN dbo.Flight AS f WITH (NOLOCK) ON f.FlightId = fi.FlightId
LEFT JOIN dbo.FlightInfo AS f1 WITH (NOLOCK) ON f1.FlightId = f.FlightId AND f1.ListFlightInfoId=3--ACRegNo
LEFT JOIN dbo.FlightInfo AS f2 WITH (NOLOCK) ON f2.FlightId = f.FlightId AND f2.ListFlightInfoId=6--ACType
LEFT JOIN dbo.FlightInfo AS f3 WITH (NOLOCK) ON f3.FlightId = f.FlightId AND f3.ListFlightInfoId IN(90,91)--RampTime
LEFT JOIN dbo.FlightInfo AS f4 WITH (NOLOCK) ON f4.FlightId = f.FlightId AND f4.ListFlightInfoId=101--ACTypeIs
LEFT JOIN dbo.FlightInfo AS f5 WITH (NOLOCK) ON f5.FlightId = f.FlightId AND f5.ListFlightInfoId=102--IsVIp
LEFT JOIN dbo.ListACType AS ac WITH (NOLOCK) ON ac.Code = f2.InfoValue --- ACType Weight
LEFT JOIN dbo.ParkingBay AS pb WITH (NOLOCK) ON pb.ParkingBay = dbo.fn_getParkingBay(fi.InfoValue) 
WHERE fi.ListFlightInfoId=15 AND ISNULL(fi.InfoValue,'')<>'' AND ISNULL (f.[Status],0)=1 AND ISNULL(f.StandDateTime,'')<>'' AND f3.InfoValue<>'1/1/1900 12:00:00 AM' AND f3.InfoValue<>''
AND f.StandDateTime between DATEADD(HOUR,-7,CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND DATEADD(HOUR,32,CAST(CAST(GETDATE() AS DATE) AS DATETIME))
  ) AS A
GROUP BY A.PRK,A.ArrDep,A.StandDateTime,A.FlightNo,A.FlightId,A.FlightDate,A.[Route],A.LinkFlightId,A.[LinkFlight],A.ACRegNo,A.ACType,A.[Weight],A.PRKWeight,A.IsAPU,A.IsVip,A.PRKAPU,A.AD
GO
/****** Object:  View [dbo].[vw_ParkingBay_Merge]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO





CREATE   VIEW [dbo].[vw_ParkingBay_Merge]
as
SELECT [PRK]=V0.PRK
--,[Rank1]=MIN(V0.Rank1)
,[PRKWeight]=V0.PRKWeight
,[PRKAPU]=V0.PRKAPU
,[FlightIdIn]=CASE WHEN V0.ArrDep='A' THEN V0.FlightId ELSE V1.FlightId END
,[FlightNoIn]=CASE WHEN V0.ArrDep='A' THEN V0.FlightNo ELSE V1.FlightNo END
,[StandDateTimeIn]=CASE WHEN V0.ArrDep='A' THEN V0.StandDateTime ELSE V1.StandDateTime END
,[StandDateTimeOut]=CASE WHEN V0.ArrDep='D' THEN V0.StandDateTime ELSE V2.StandDateTime END
,[FlightIdOut]=CASE WHEN V0.ArrDep='D' THEN V0.FlightId ELSE V2.FlightId END
,[FlightNoOut]=CASE WHEN V0.ArrDep='D' THEN V0.FlightNo ELSE V2.FlightNo END
,[FlightDateIn]=CASE WHEN V0.ArrDep='A' THEN V0.FlightDate ELSE V1.FlightDate END
,[FlightDateOut]=CASE WHEN V0.ArrDep='D' THEN V0.FlightDate ELSE V2.FlightDate END
,[RouteIn]=CASE WHEN V0.ArrDep='A' THEN V0.[ROUTE] ELSE V1.[ROUTE] END
,[RouteOut]=CASE WHEN V0.ArrDep='D' THEN V0.[ROUTE] ELSE V2.[ROUTE] END
,[AcRegNoIn]=CASE WHEN V0.ArrDep='A' THEN V0.ACRegNo ELSE V1.ACRegNo END
,[AcRegNoOut]=CASE WHEN V0.ArrDep='D' THEN V0.ACRegNo ELSE V2.ACRegNo END
,[ACTypeIn]=CASE WHEN V0.ArrDep='A' THEN V0.ACType ELSE V1.ACType END
,[ACTypeOut]=CASE WHEN V0.ArrDep='D' THEN V0.ACType ELSE V2.ACType END
,[ArrDepIn]=CASE WHEN V0.ArrDep='A' THEN V0.AD ELSE V1.AD END
,[ArrDepOut]=CASE WHEN V0.ArrDep='D' THEN V0.AD ELSE V2.AD END
,[LinkFlightIn]=CASE WHEN V0.ArrDep='A' THEN V0.LinkFlight ELSE V1.LinkFlight END
,[LinkFlightOut]=CASE WHEN V0.ArrDep='D' THEN V0.LinkFlight ELSE V2.LinkFlight END
,[LinkFlightIdIn]=CASE WHEN V0.ArrDep='A' THEN V0.LinkFlightId ELSE V1.LinkFlightId END
,[LinkFlightIdOut]=CASE WHEN V0.ArrDep='D' THEN V0.LinkFlightId ELSE V2.LinkFlightId END
,[IsAPUOut]=CAST(ISNULL((CASE WHEN V0.ArrDep='D' THEN V0.IsAPU ELSE V2.IsAPU END),0) AS BIT)
,[IsVipIn]=CASE WHEN V0.ArrDep='A' THEN V0.IsVip ELSE V1.IsVip END
,[IsVipOut]=CASE WHEN V0.ArrDep='D' THEN V0.IsVip ELSE V2.IsVip END
,[WeightIn]=CASE WHEN V0.ArrDep='A' THEN V0.[Weight] ELSE V1.[Weight] END
,[WeightOut]=CASE WHEN V0.ArrDep='D' THEN V0.[Weight] ELSE V2.[Weight] END
,[ParkTime]=DATEDIFF(MINUTE,CASE WHEN V0.ArrDep='A' THEN V0.StandDateTime ELSE V1.StandDateTime END,CASE WHEN V0.ArrDep='D' THEN V0.StandDateTime ELSE V2.StandDateTime END)
,[Alert]=dbo.fn_cal_AlertParkingBay(CASE WHEN V0.ArrDep='A' THEN V0.ACRegNo ELSE V1.ACRegNo END,CASE WHEN V0.ArrDep='D' THEN V0.ACRegNo ELSE V2.ACRegNo END,CASE WHEN V0.ArrDep='A' THEN V0.StandDateTime ELSE V1.StandDateTime END,CASE WHEN V0.ArrDep='D' THEN V0.StandDateTime ELSE V2.StandDateTime END,CASE WHEN V0.ArrDep='A' THEN V0.[Weight] ELSE V1.[Weight] END,CASE WHEN V0.ArrDep='D' THEN V0.[Weight] ELSE V2.[Weight] END,V0.PRKWeight, CAST(ISNULL((CASE WHEN V0.ArrDep='D' THEN V0.IsAPU ELSE V2.IsAPU END),0) AS BIT),V0.PRKAPU,CASE WHEN V0.ArrDep='A' THEN V0.FlightId ELSE V1.FlightId END,CASE WHEN V0.ArrDep='D' THEN V0.LinkFlightId ELSE V2.LinkFlightId END)
--,[RankMerge]=CAST(CASE WHEN V0.ArrDep='A' THEN V0.Rank1 ELSE V1.Rank1 END AS VARCHAR(10))+'|'+CAST(CASE WHEN V0.ArrDep='D' THEN V0.Rank1 ELSE V2.Rank1 END AS VARCHAR(10))
FROM dbo.vw_ParkingBay AS V0
LEFT JOIN dbo.vw_ParkingBay AS V1 ON V0.PRK=V1.PRK AND V1.Rank2 = V0.Rank1 AND V1.ArrDep<>V0.ArrDep AND V1.ArrDep='A'
LEFT JOIN dbo.vw_ParkingBay AS V2 ON V0.PRK=V2.PRK AND V2.Rank0 = V0.Rank1 AND V2.ArrDep<>V0.ArrDep AND V2.ArrDep='D'
GROUP BY V0.PRK,v0.PRKWeight,V0.PRKAPU
,CAST(CASE WHEN V0.ArrDep='A' THEN V0.Rank1 ELSE V1.Rank1 END AS VARCHAR(10))+'|'+CAST(CASE WHEN V0.ArrDep='D' THEN V0.Rank1 ELSE V2.Rank1 END AS VARCHAR(10))
,CASE WHEN V0.ArrDep='A' THEN V0.StandDateTime ELSE V1.StandDateTime END
,CASE WHEN V0.ArrDep='D' THEN V0.StandDateTime ELSE V2.StandDateTime END
,CASE WHEN V0.ArrDep='A' THEN V0.FlightNo ELSE V1.FlightNo END
,CASE WHEN V0.ArrDep='D' THEN V0.FlightNo ELSE V2.FlightNo END
,CASE WHEN V0.ArrDep='A' THEN V0.FlightId ELSE V1.FlightId END
,CASE WHEN V0.ArrDep='D' THEN V0.FlightId ELSE V2.FlightId END
,CASE WHEN V0.ArrDep='A' THEN V0.ACRegNo ELSE V1.ACRegNo END
,CASE WHEN V0.ArrDep='D' THEN V0.ACRegNo ELSE V2.ACRegNo END
,CASE WHEN V0.ArrDep='A' THEN V0.ACType ELSE V1.ACType END
,CASE WHEN V0.ArrDep='D' THEN V0.ACType ELSE V2.ACType END
,CASE WHEN V0.ArrDep='A' THEN V0.AD ELSE V1.AD END
,CASE WHEN V0.ArrDep='D' THEN V0.AD ELSE V2.AD END
,CASE WHEN V0.ArrDep='A' THEN V0.[Route] ELSE V1.[Route] END
,CASE WHEN V0.ArrDep='D' THEN V0.[Route] ELSE V2.[Route] END
,CASE WHEN V0.ArrDep='A' THEN V0.LinkFlight ELSE V1.LinkFlight END
,CASE WHEN V0.ArrDep='D' THEN V0.LinkFlight ELSE V2.LinkFlight END
,CASE WHEN V0.ArrDep='A' THEN V0.FlightDate ELSE V1.FlightDate END
,CASE WHEN V0.ArrDep='D' THEN V0.FlightDate ELSE V2.FlightDate END
,CASE WHEN V0.ArrDep='A' THEN V0.LinkFlightId ELSE V1.LinkFlightId END
,CASE WHEN V0.ArrDep='D' THEN V0.LinkFlightId ELSE V2.LinkFlightId END
,CASE WHEN V0.ArrDep='A' THEN V0.[Weight] ELSE V1.[Weight] END
,CASE WHEN V0.ArrDep='D' THEN V0.[Weight] ELSE V2.[Weight] END
,CASE WHEN V0.ArrDep='A' THEN V0.IsVip ELSE V1.IsVip END
,CASE WHEN V0.ArrDep='D' THEN V0.IsVip ELSE V2.IsVip END
,CAST(ISNULL((CASE WHEN V0.ArrDep='D' THEN V0.IsAPU ELSE V2.IsAPU END),0) AS BIT)
GO
/****** Object:  Table [dbo].[BKFlight]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
