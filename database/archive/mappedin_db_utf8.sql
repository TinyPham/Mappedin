USE [master]
GO
/****** Object:  Database [LongThanhFlightBK]    Script Date: 5/11/2026 8:16:50 AM ******/
CREATE DATABASE [LongThanhFlightBK]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'LongThanhFlightBK', FILENAME = N'/var/opt/mssql/data/LongThanhFlightBK.mdf' , SIZE = 139264KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'LongThanhFlightBK_log', FILENAME = N'/var/opt/mssql/data/LongThanhFlightBK_log.ldf' , SIZE = 466944KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [LongThanhFlightBK] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [LongThanhFlightBK].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [LongThanhFlightBK] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET ARITHABORT OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET AUTO_CLOSE ON 
GO
ALTER DATABASE [LongThanhFlightBK] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [LongThanhFlightBK] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [LongThanhFlightBK] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET  ENABLE_BROKER 
GO
ALTER DATABASE [LongThanhFlightBK] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [LongThanhFlightBK] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET RECOVERY FULL 
GO
ALTER DATABASE [LongThanhFlightBK] SET  MULTI_USER 
GO
ALTER DATABASE [LongThanhFlightBK] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [LongThanhFlightBK] SET DB_CHAINING OFF 
GO
ALTER DATABASE [LongThanhFlightBK] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [LongThanhFlightBK] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [LongThanhFlightBK] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [LongThanhFlightBK] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [LongThanhFlightBK] SET QUERY_STORE = ON
GO
ALTER DATABASE [LongThanhFlightBK] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [LongThanhFlightBK]
GO
/****** Object:  UserDefinedFunction [dbo].[fn_BuildContiguousCounterSpec]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[fn_BuildContiguousCounterSpec] (
    @StartNo INT,
    @CounterCount INT
)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @result NVARCHAR(100);
    DECLARE @endNo INT;

    IF @StartNo IS NULL OR @CounterCount IS NULL OR @StartNo <= 0 OR @CounterCount <= 0
        RETURN NULL;

    SET @endNo = @StartNo + @CounterCount - 1;
    IF @CounterCount = 1
        SET @result = CONVERT(NVARCHAR(20), @StartNo);
    ELSE
        SET @result = CONVERT(NVARCHAR(20), @StartNo) + N'-' + CONVERT(NVARCHAR(20), @endNo);

    RETURN @result;
END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_ExtractFirstInt]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[fn_ExtractFirstInt] (@Text NVARCHAR(200))
RETURNS INT
AS
BEGIN
    DECLARE @value NVARCHAR(50) = N'';
    DECLARE @i INT = 1;
    DECLARE @len INT = LEN(ISNULL(@Text, N''));
    DECLARE @started BIT = 0;
    DECLARE @ch NCHAR(1);

    WHILE @i <= @len
    BEGIN
        SET @ch = SUBSTRING(@Text, @i, 1);
        IF @ch LIKE N'[0-9]'
        BEGIN
            SET @value += @ch;
            SET @started = 1;
        END
        ELSE IF @started = 1
        BEGIN
            BREAK;
        END
        SET @i += 1;
    END

    RETURN TRY_CONVERT(INT, NULLIF(@value, N''));
END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_NormalizeCounterSpec]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[fn_NormalizeCounterSpec] (@Spec NVARCHAR(100))
RETURNS NVARCHAR(100)
AS
BEGIN
    RETURN NULLIF(REPLACE(REPLACE(LTRIM(RTRIM(ISNULL(@Spec, N''))), N' ', N''), N';', N','), N'');
END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_NormalizeFlightRoute]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[fn_NormalizeFlightRoute] (
    @Route NVARCHAR(100),
    @ArrDep CHAR(1)
)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @clean NVARCHAR(100) = UPPER(LTRIM(RTRIM(ISNULL(@Route, N''))));
    DECLARE @dash INT;
    DECLARE @leftCode NVARCHAR(20);
    DECLARE @rightCode NVARCHAR(20);
    DECLARE @otherCode NVARCHAR(20);

    IF @clean = N''
        RETURN NULL;

    SET @clean = REPLACE(REPLACE(REPLACE(@clean, N' ', N''), N'/', N'-'), N'_', N'-');
    SET @dash = CHARINDEX(N'-', @clean);

    IF @dash > 0
    BEGIN
        SET @leftCode = NULLIF(LEFT(@clean, @dash - 1), N'');
        SET @rightCode = NULLIF(SUBSTRING(@clean, @dash + 1, LEN(@clean)), N'');
    END
    ELSE
    BEGIN
        SET @leftCode = @clean;
        SET @rightCode = NULL;
    END

    IF @ArrDep = 'D'
    BEGIN
        SET @otherCode = CASE
            WHEN @rightCode IS NOT NULL AND @rightCode NOT IN (N'LTH', N'DIN', N'SGN', N'TSN') THEN @rightCode
            WHEN @leftCode IS NOT NULL AND @leftCode NOT IN (N'LTH', N'DIN', N'SGN', N'TSN') THEN @leftCode
            ELSE COALESCE(@rightCode, @leftCode, N'UNK')
        END;
        RETURN N'LTH-' + @otherCode;
    END

    SET @otherCode = CASE
        WHEN @leftCode IS NOT NULL AND @leftCode NOT IN (N'LTH', N'DIN', N'SGN', N'TSN') THEN @leftCode
        WHEN @rightCode IS NOT NULL AND @rightCode NOT IN (N'LTH', N'DIN', N'SGN', N'TSN') THEN @rightCode
        ELSE COALESCE(@leftCode, @rightCode, N'UNK')
    END;

    RETURN @otherCode + N'-LTH';
END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_ParseCounterSpec]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* -------------------------------------------------------------
   Helper functions
------------------------------------------------------------- */
CREATE FUNCTION [dbo].[fn_ParseCounterSpec] (@Spec NVARCHAR(100))
RETURNS @Counters TABLE (
    CounterNo INT NOT NULL PRIMARY KEY
)
AS
BEGIN
    DECLARE @work NVARCHAR(100) = REPLACE(REPLACE(ISNULL(@Spec, N''), N' ', N''), N';', N',');
    DECLARE @token NVARCHAR(50);
    DECLARE @dash INT;
    DECLARE @startNo INT;
    DECLARE @endNo INT;
    DECLARE @current INT;
    DECLARE @comma INT;

    WHILE LEN(@work) > 0
    BEGIN
        SET @comma = CHARINDEX(N',', @work);
        IF @comma = 0
        BEGIN
            SET @token = @work;
            SET @work = N'';
        END
        ELSE
        BEGIN
            SET @token = LEFT(@work, @comma - 1);
            SET @work = SUBSTRING(@work, @comma + 1, LEN(@work));
        END

        IF @token = N'' CONTINUE;

        SET @dash = CHARINDEX(N'-', @token);
        IF @dash > 0
        BEGIN
            SET @startNo = TRY_CONVERT(INT, LEFT(@token, @dash - 1));
            SET @endNo = TRY_CONVERT(INT, SUBSTRING(@token, @dash + 1, LEN(@token)));
        END
        ELSE
        BEGIN
            SET @startNo = TRY_CONVERT(INT, @token);
            SET @endNo = @startNo;
        END

        IF @startNo IS NULL OR @endNo IS NULL OR @startNo <= 0 OR @endNo <= 0 CONTINUE;
        IF @startNo > @endNo
        BEGIN
            DECLARE @swap INT = @startNo;
            SET @startNo = @endNo;
            SET @endNo = @swap;
        END

        SET @current = @startNo;
        WHILE @current <= @endNo
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM @Counters WHERE CounterNo = @current)
            BEGIN
                INSERT INTO @Counters (CounterNo) VALUES (@current);
            END
            SET @current += 1;
        END
    END

    RETURN;
END
GO
/****** Object:  Table [dbo].[Flight]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Flight](
	[FlightId] [bigint] IDENTITY(1,1) NOT NULL,
	[SourceFlightId] [int] NULL,
	[FlightNo] [nvarchar](50) NOT NULL,
	[FlightDate] [date] NOT NULL,
	[ArrDep] [char](1) NOT NULL,
	[Route] [nvarchar](100) NULL,
	[Airline] [nvarchar](200) NULL,
	[Status] [nvarchar](100) NULL,
	[ScheduledTime] [time](7) NULL,
	[EstimatedTime] [time](7) NULL,
	[ActualTime] [time](7) NULL,
	[Gate] [int] NULL,
	[CheckInIsland] [char](1) NULL,
	[CheckInCounterSpec] [nvarchar](100) NULL,
	[Belt] [int] NULL,
	[IsSimulatedCheckIn] [bit] NOT NULL,
	[IsSimulatedGate] [bit] NOT NULL,
	[IsSimulatedBelt] [bit] NOT NULL,
	[RawPayload] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[FlightId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FlightCheckInCounter]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FlightCheckInCounter](
	[FlightId] [bigint] NOT NULL,
	[CheckInIsland] [char](1) NOT NULL,
	[CounterNo] [int] NOT NULL,
 CONSTRAINT [PK_FlightCheckInCounter] PRIMARY KEY CLUSTERED 
(
	[FlightId] ASC,
	[CheckInIsland] ASC,
	[CounterNo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FlightInfoRaw]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FlightInfoRaw](
	[FlightInfoRawId] [bigint] IDENTITY(1,1) NOT NULL,
	[SourceFlightInfoId] [bigint] NULL,
	[SourceFlightId] [int] NOT NULL,
	[ListFlightInfoId] [int] NOT NULL,
	[InfoValue] [nvarchar](max) NULL,
	[InputSource] [varchar](40) NULL,
	[InputTime] [datetime] NULL,
	[ImportedAt] [datetime2](7) NOT NULL,
	[SourceSystem] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[FlightInfoRawId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FlightRaw]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FlightRaw](
	[FlightRawId] [bigint] IDENTITY(1,1) NOT NULL,
	[SourceFlightId] [int] NULL,
	[FlightNo] [varchar](10) NULL,
	[FlightDate] [date] NULL,
	[Route] [varchar](20) NULL,
	[LinkFlight] [varchar](25) NULL,
	[FlightDateTime] [datetime] NULL,
	[ArrDep] [varchar](1) NULL,
	[Status] [bit] NULL,
	[FlightDateICAO] [date] NULL,
	[StandDateTime] [datetime] NULL,
	[FinishDateTime] [datetime] NULL,
	[RawJson] [nvarchar](max) NULL,
	[ImportedAt] [datetime2](7) NOT NULL,
	[SourceSystem] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[FlightRawId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FlightStatusRaw]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FlightStatusRaw](
	[FlightStatusId] [int] NOT NULL,
	[FlightStatusName] [varchar](3) NULL,
	[FieldName] [varchar](10) NULL,
	[Domestic] [int] NULL,
	[International] [int] NULL,
	[Sortby] [int] NULL,
	[Remarks] [nvarchar](250) NULL,
	[ImportedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[FlightStatusId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ListCarrierRaw]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ListCarrierRaw](
	[Carrier] [varchar](2) NOT NULL,
	[Code3] [varchar](3) NULL,
	[CarrierName] [nvarchar](100) NULL,
	[NumericCode] [varchar](5) NULL,
	[Country] [varchar](2) NULL,
	[PNLButtons] [varchar](50) NULL,
	[Status] [varchar](3) NULL,
	[CheckinOpen] [int] NULL,
	[FirstBag] [int] NULL,
	[LastBag] [int] NULL,
	[Mgha] [varchar](10) NULL,
	[LastModifiedDate] [datetime] NULL,
	[LastModifiedBy] [varchar](1000) NULL,
	[ImportedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Carrier] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ListFlightInfoRaw]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ListFlightInfoRaw](
	[ListFlightInfoId] [int] NOT NULL,
	[ShortName] [varchar](20) NULL,
	[FullName] [varchar](50) NULL,
	[FiledType] [varchar](20) NULL,
	[Description] [nvarchar](500) NULL,
	[ArrDep] [varchar](1) NULL,
	[SourceName] [varchar](20) NULL,
	[SourceNameMap] [varchar](50) NULL,
	[OrderBy] [int] NULL,
	[IsTime] [bit] NULL,
	[ImportedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ListFlightInfoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ListTimeRaw]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ListTimeRaw](
	[ListTimeId] [int] NOT NULL,
	[TimeSTR] [varchar](5) NULL,
	[TimeUTC] [varchar](5) NULL,
	[TimeLocal] [varchar](5) NULL,
	[TimeMinute] [int] NULL,
	[TimeFIDS] [varchar](5) NULL,
	[TimeFIDSBlock5UP] [varchar](5) NULL,
	[TimeFIDSBlock5DOWN] [varchar](5) NULL,
	[ImportedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ListTimeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MasterBelt]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MasterBelt](
	[Belt] [int] NOT NULL,
	[BeltType] [nvarchar](30) NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Belt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MasterCheckInCounter]    Script Date: 5/11/2026 8:16:52 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MasterCheckInCounter](
	[CheckInIsland] [char](1) NOT NULL,
	[CounterNo] [int] NOT NULL,
	[IsActive] [bit] NOT NULL,
 CONSTRAINT [PK_MasterCheckInCounter] PRIMARY KEY CLUSTERED 
