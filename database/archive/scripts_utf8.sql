USE [master]
GO
/****** Object:  Database [ACISPDIN]    Script Date: 5/5/2026 12:20:40 PM ******/
CREATE DATABASE [ACISPDIN]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'ACDMSGN', FILENAME = N'/var/opt/mssql/data/ACISPDIN.mdf' , SIZE = 348352KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'ACDMSGN_log', FILENAME = N'/var/opt/mssql/data/ACISPDIN_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [ACISPDIN] SET COMPATIBILITY_LEVEL = 150
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [ACISPDIN].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [ACISPDIN] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [ACISPDIN] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [ACISPDIN] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [ACISPDIN] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [ACISPDIN] SET ARITHABORT OFF 
GO
ALTER DATABASE [ACISPDIN] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [ACISPDIN] SET AUTO_SHRINK ON 
GO
ALTER DATABASE [ACISPDIN] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [ACISPDIN] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [ACISPDIN] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [ACISPDIN] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [ACISPDIN] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [ACISPDIN] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [ACISPDIN] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [ACISPDIN] SET  DISABLE_BROKER 
GO
ALTER DATABASE [ACISPDIN] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [ACISPDIN] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [ACISPDIN] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [ACISPDIN] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [ACISPDIN] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [ACISPDIN] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [ACISPDIN] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [ACISPDIN] SET RECOVERY SIMPLE 
GO
ALTER DATABASE [ACISPDIN] SET  MULTI_USER 
GO
ALTER DATABASE [ACISPDIN] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [ACISPDIN] SET DB_CHAINING OFF 
GO
ALTER DATABASE [ACISPDIN] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [ACISPDIN] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [ACISPDIN] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [ACISPDIN] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [ACISPDIN] SET QUERY_STORE = OFF
GO
USE [ACISPDIN]
GO
/****** Object:  UserDefinedFunction [dbo].[fChuyenCoDauThanhKhongDau]    Script Date: 5/5/2026 12:20:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[fChuyenCoDauThanhKhongDau](@inputVar2 NVARCHAR(MAX) )
    RETURNS NVARCHAR(MAX)
    AS
    BEGIN 
    	declare @inputVar NVARCHAR(MAX)    	
        IF (@inputVar2 IS NULL OR @inputVar2 = '')  RETURN ''
		--SET @inputVar=LOWER(@inputVar2)
		SET @inputVar=REPLACE(@inputVar2,'  ',' ')
		SET @inputVar=LTRIM(RTRIM((@inputVar)))
		SET @inputVar=REPLACE(@inputVar,'  ',' ')
		SET @inputVar=REPLACE(@inputVar,'  ',' ')
        --DECLARE @RT NVARCHAR(MAX)
        DECLARE @SIGN_CHARS NCHAR(256)
        DECLARE @UNSIGN_CHARS NCHAR (256)
     
        SET @SIGN_CHARS = N'ăâđêôơưàảãạáằẳẵặắầẩẫậấèẻẽẹéềểễệếìỉĩịíòỏõọóồổỗộốờởỡợớùủũụúừửữựứỳỷỹỵýĂÂĐÊÔƠƯÀẢÃẠÁẰẲẴẶẮẦẨẪẬẤÈẺẼẸÉỀỂỄỆẾÌỈĨỊÍÒỎÕỌÓỒỔỖỘỐỜỞỠỢỚÙỦŨỤÚỪỬỮỰỨỲỶỸỴÝ' + NCHAR(272) + NCHAR(208)
        SET @UNSIGN_CHARS = N'aadeoouaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiooooooooooooooouuuuuuuuuuyyyyyAADEOOUAAAAAAAAAAAAAAAEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOUUUUUUUUUUYYYYY'
     
        DECLARE @COUNTER int
        DECLARE @COUNTER1 int
       
        SET @COUNTER = 1
        WHILE (@COUNTER <= LEN(@inputVar))
        BEGIN  
            SET @COUNTER1 = 1
            WHILE (@COUNTER1 <= LEN(@SIGN_CHARS) + 1)
            BEGIN
                IF UNICODE(SUBSTRING(@SIGN_CHARS, @COUNTER1,1)) = UNICODE(SUBSTRING(@inputVar,@COUNTER ,1))
                BEGIN          
                    IF @COUNTER = 1
                        SET @inputVar = SUBSTRING(@UNSIGN_CHARS, @COUNTER1,1) + SUBSTRING(@inputVar, @COUNTER+1,LEN(@inputVar)-1)      
                    ELSE
                        SET @inputVar = SUBSTRING(@inputVar, 1, @COUNTER-1) +SUBSTRING(@UNSIGN_CHARS, @COUNTER1,1) + SUBSTRING(@inputVar, @COUNTER+1,LEN(@inputVar)- @COUNTER)
                    BREAK
                END
                SET @COUNTER1 = @COUNTER1 +1
            END
            SET @COUNTER = @COUNTER +1
        END
        -- SET @inputVar = replace(@inputVar,' ','-')
        RETURN @inputVar
    END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_AtttCaculationForReport]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE   FUNCTION [dbo].[fn_AtttCaculationForReport] (@Acgt VARCHAR(5), @Aegt VARCHAR(5),@Aobt VARCHAR (5), @Aibt varchar(5))
RETURNS INT
AS
BEGIN
	DECLARE @rs INT
	SET @rs =  CASE WHEN ABS([dbo].fn_timediff(@Acgt, @Aegt)) < 120  THEN [dbo].fn_timediff(@Acgt, @Aegt) ELSE  [dbo].fn_timediff(@Aibt, @Aobt) END
	--THEN [dbo].fn_timediff(@Acgt, @Aegt) ELSE  [dbo].fn_timediff(@Aibt, @Aobt)
	
	RETURN @rs
END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_autoCorrectTime]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
  CREATE   function [dbo].[fn_autoCorrectTime](@ST varchar(5),@OT varchar(5))
  returns varchar (5)
  as
  begin
	declare @rs varchar(5),@timeBaseInt int
	if len(@ST)<4 or len(@OT)<4 return @OT
	select @timeBaseInt=lt.TimeMinute from ListTime as lt with (nolock) where lt.TimeSTR=left(@ST,4)
	if @timeBaseInt is null return @OT
	set @OT=left(@OT,4)
	select top 1 @rs=lt.TimeSTR from ListTime as lt with (nolock) 
	where lt.TimeSTR=@OT or lt.TimeSTR=@OT+'+' or lt.TimeSTR=@OT+'-'
	order by abs(@timeBaseInt-lt.TimeMinute) asc
	return @rs
  end
GO
/****** Object:  UserDefinedFunction [dbo].[fn_base]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[fn_base]()
RETURNS VARCHAR(3)
AS
BEGIN
  DECLARE @Base VARCHAR(3)
  SELECT top 1 @Base=lc.FieldValue from ListConfig lc WITH (NOLOCK) WHERE lc.FieldName='Base'
	RETURN ISNULL(@Base,'XXX')
END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_baymovementcal]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE   FUNCTION [dbo].[fn_baymovementcal](@FlightID INT)
  RETURNS DATETIME
  AS
  BEGIN
    DECLARE @flightdate DATE,@timestr1 VARCHAR(5),@timestr2 VARCHAR(5),@timestr3 VARCHAR(5),@timestr4a VARCHAR(5),@timestr4b VARCHAR(5), @timestr4c VARCHAR(5)
    SELECT  @flightdate=v.FlightDate, @timestr4a=v.ScheTime, @timestr4b=v.EIBT, @timestr4c=v.EOBT, @timestr3=v.TOBT,
           @timestr2=v.AIBT, @timestr1=v.AOBT
      FROM(select TOP 1 f.FlightId,f.FlightDate
,[ScheTime] = max(case when fi.ListFlightInfoId=9 then try_cast(fi.InfoValue AS varchar(5)) end)
,[EIBT] =  max(case when fi.ListFlightInfoId=20 then try_cast(fi.InfoValue AS varchar(5)) end)
,[EOBT] =  max(case when fi.ListFlightInfoId=10 then try_cast(fi.InfoValue AS varchar(5)) end)
,[TOBT] = max(case when fi.ListFlightInfoId=25 then try_cast(fi.InfoValue AS varchar(5)) end)
,[AIBT] = max(case when fi.ListFlightInfoId=32 AND f.ArrDep = 'A' then try_cast(fi.InfoValue AS varchar(5)) end)
,[AOBT] = max(case when fi.ListFlightInfoId=31 AND f.ArrDep = 'D' then try_cast(fi.InfoValue AS varchar(5)) end)
from dbo.Flight AS f WITH (NOLOCK) 
LEFT JOIN dbo.FlightInfo AS fi WITH (NOLOCK) ON fi.FlightId = f.FlightId 
WHERE f.FlightId=@FlightID --AND (ISNULL(fi.InputSource,'')<>'SYSTEM' OR fi.ListFlightInfoId=9)
group by f.FlightId,f.FlightDate) v
  	DECLARE @timestr5 VARCHAR(5)='0000',@timeint5 INT=0
  	IF LEN(ISNULL(@timestr4a,''))>3
  		SET @timestr5=@timestr4a
  	IF LEN(ISNULL(@timestr4b,''))>3
  		SET @timestr5=@timestr4b
	IF LEN(ISNULL(@timestr4c,''))>3
  		SET @timestr5=@timestr4c
	IF LEN(ISNULL(@timestr3,''))>3
  		SET @timestr5=@timestr3
  	IF LEN(ISNULL(@timestr2,''))>3
  		SET @timestr5=@timestr2
  	IF LEN(ISNULL(@timestr1,''))>3
  		SET @timestr5=@timestr1  		
  	DECLARE @rs DATETIME=@flightdate
	SELECT TOP 1 @timeint5=lt.TimeMinute
  	  FROM ListTime AS lt WHERE lt.TimeSTR=@timestr5
  	--SET @timeint4=ISNULL(ISNULL(ISNULL(@timeint1,@timeint2),@timeint3),0)
  	SET @timeint5=ISNULL(@timeint5,0)
  	SET @rs=DATEADD(minute,@timeint5,CAST(@flightdate AS DATETIME))
  	RETURN @rs
  END
  
  --UPDATE Flight
  --SET

  --	FlightDateTime = [dbo].[fn_timecalcbyflightid](FlightId)
  --SELECT fi.FlightId,[dbo].[fn_timecalcbyflightid](fi.FlightId)
  --  FROM FlightInfo AS fi WHERE fi.ListFlightInfoId IN(9,10,11) AND LEN(ISNULL(fi.InfoValue,''))>3
  --GROUP BY fi.FlightId
GO
/****** Object:  UserDefinedFunction [dbo].[fn_cal_AlertParkingBay]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE   FUNCTION [dbo].[fn_cal_AlertParkingBay](@AcRegIn VARCHAR(50), @AcRegOut VARCHAR(50), @TimeIn DATETIME, @TimeOut DATETIME, @WeightIn INT, @WeightOut INT, @PRKWeight INT, @IsAPU BIT, @PRKAPU BIT, @FlightIDIN INT, @LinkFlightIdOut INT)
RETURNS VARCHAR(50)
AS
BEGIN
	DECLARE @str VARCHAR(50) = ''
	IF ISNULL(@AcRegIn,'') <> ISNULL(@AcRegOut,'') AND ISNULL(@AcRegIn,'') <> '' AND ISNULL(@AcRegOut,'') <> ''
		SET @str = @str + 'A1'
	IF ISNULL(@TimeIn,'') = ''
		SET @str = @str + 'A2'
	IF ISNULL(@TimeOut,'') = '' AND @TimeIn <= DATEADD(HOUR,22,CAST(CAST(GETDATE() AS DATE) AS DATETIME))
	--IF ISNULL(@TimeOut,'') = '' AND (CAST(@TimeIn AS DATE) < CAST(GETDATE() AS DATE) OR (CAST(@TimeIn AS DATE) = CAST(GETDATE() AS DATE) AND DATEPART(HOUR, @TimeIn)<=22))
		SET @str = @str + 'A3'
	IF ISNULL(@WeightIn,0) > ISNULL(@PRKWeight,0)
		SET @str = @str + 'A4'
	IF ISNULL(@WeightOut,0) > ISNULL(@PRKWeight,0)
		SET @str = @str + 'A5'
	IF ISNULL(@IsAPU,0) = 1 AND @PRKAPU=0
		SET @str = @str + 'A6'
	IF ISNULL(@FlightIDIN,0) <> 0 AND ISNULL(@LinkFlightIdOut,0) <> 0 AND ISNULL(@FlightIDIN,0) <> ISNULL(@LinkFlightIdOut,0) 
		SET @str = @str + 'A7'
	RETURN @str
END

--pr_view_parkingbayMoves
GO
/****** Object:  UserDefinedFunction [dbo].[fn_CalcAlert]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   FUNCTION [dbo].[fn_CalcAlert]
(
	@Formula NVARCHAR(MAX),
	@Parameter NVARCHAR(MAX),
	@FieldValue NVARCHAR(MAX),
	@FieldBeforeValue NVARCHAR(MAX),
	@AlertFieldValue nvarchar(MAX),
	@AlertFieldBeforeValue nvarchar(MAX),
	@InputSource VARCHAR(40),
	@BeforeInputSource VARCHAR(40),
	@FlightDate DATETIME
)
RETURNS bit
AS

BEGIN
	DECLARE @rs BIT	
	DECLARE @TimeInt1 INT, @TimeInt2 INT , @TimeInt3 INT  , @TimeInt4 INT  
	DECLARE @Time1 DATETIME, @Time2 DATETIME , @Time3 DATETIME  , @Time4 DATETIME  
	IF @Formula ='compare_absolute'
	BEGIN
		SET @rs=0
	    SELECT @TimeInt1 = lt.TimeMinute
	    FROM   dbo.ListTime AS lt WITH (NOLOCK)
	    WHERE  lt.TimeSTR = @AlertFieldValue
	    
	    SELECT @TimeInt2 = lt.TimeMinute
	    FROM   dbo.ListTime AS lt WITH (NOLOCK)
	    WHERE  lt.TimeSTR = @FieldValue	    
	    IF ABS(@TimeInt1-@TimeInt2)>try_cast(@Parameter AS INT) AND @TimeInt1 IS NOT NULL 
			SET @rs=1
	END	
	IF @Formula ='compare'
	BEGIN
		SET @rs=0
	    SELECT @TimeInt1 = lt.TimeMinute
	    FROM   dbo.ListTime AS lt WITH (NOLOCK)
	    WHERE  lt.TimeSTR = @AlertFieldValue
	    
	    SELECT @TimeInt2 = lt.TimeMinute
	    FROM   dbo.ListTime AS lt WITH (NOLOCK)
	    WHERE  lt.TimeSTR = @FieldValue    
	    IF @TimeInt1-@TimeInt2>try_cast(@Parameter AS INT) AND @TimeInt1 IS NOT NULL
			SET @rs=1
	END	
	IF @Formula ='discrepancy'
	BEGIN    
		SET @rs=0
	    IF @AlertFieldValue<>@AlertFieldBeforeValue AND @AlertFieldBeforeValue<>''
			SET @rs=1
	END	
	IF @Formula ='is'
	BEGIN    
		SET @rs=0
	    IF @AlertFieldValue=@Parameter
			SET @rs=1
	END	
	IF @Formula ='compare_previous'
	BEGIN    
		SET @rs=0
	    SELECT @TimeInt1 = lt.TimeMinute
	    FROM   dbo.ListTime AS lt WITH (NOLOCK)
	    WHERE  lt.TimeSTR = @AlertFieldValue
	    
	    SELECT @TimeInt2 = lt.TimeMinute
	    FROM   dbo.ListTime AS lt WITH (NOLOCK)
	    WHERE  lt.TimeSTR = @AlertFieldBeforeValue	    
	    IF @TimeInt1-@TimeInt2>try_cast(@Parameter AS INT)  AND @TimeInt1 IS NOT NULL
			SET @rs=1
	END	
	IF @Formula ='exits'
	BEGIN    
		SET @rs=0
		IF ISNULL (@AlertFieldValue,'')=''
		BEGIN
			SELECT @TimeInt1 = lt.TimeMinute
			FROM   dbo.ListTime AS lt WITH (NOLOCK)
			WHERE  lt.TimeSTR = @FieldValue
			SET @TimeInt1=@TimeInt1+try_cast(@Parameter AS INT) 
			SET @Time1= DATEADD(minute,@TimeInt1,@FlightDate)
			IF GETDATE()>@Time1 AND @TimeInt1 IS NOT NULL
				SET @rs=1
		END
	END	
	IF @Formula ='discrepancy_sum'
	BEGIN    
		SET @rs=0
		SELECT @TimeInt1 = lt.TimeMinute
	    FROM   dbo.ListTime AS lt WITH (NOLOCK) 
	    WHERE  lt.TimeSTR = @AlertFieldValue
		SELECT @TimeInt2=SUM(ISNULL(lt.TimeMinute, try_cast(fs.items AS INT)))
	               FROM   dbo.fn_split2(@FieldValue, ',') AS fs
	                      LEFT JOIN dbo.ListTime AS lt WITH (NOLOCK)
	                           ON  fs.items = lt.TimeSTR
		--IF @TimeInt1>=@TimeInt2+15 AND @TimeInt1 IS NOT NULL
		--	SET @rs=1
		IF @TimeInt1-@TimeInt2>try_cast(@Parameter AS INT) AND @TimeInt1 IS NOT NULL
	    	SET @rs=1
	END	
	IF @Formula ='compare_previous_sum'
	BEGIN    
		SET @rs=0
		SELECT @TimeInt1 = lt.TimeMinute
	    FROM   dbo.ListTime AS lt WITH (NOLOCK)
	    WHERE  lt.TimeSTR = @AlertFieldBeforeValue
		SELECT @TimeInt2=SUM(ISNULL(lt.TimeMinute, try_cast(fs.items AS INT)))
	               FROM   dbo.fn_split2(@FieldValue, ',') AS fs
	                      LEFT JOIN dbo.ListTime AS lt WITH (NOLOCK)
	                           ON  fs.items = lt.TimeSTR
	    SET @TimeInt2=@TimeInt2+ try_cast(@Parameter AS INT)                 
		IF @TimeInt1>@TimeInt2 AND @TimeInt1 IS NOT NULL
			SET @rs=1
			IF @TimeInt1-@TimeInt2>try_cast(@Parameter AS INT) AND @TimeInt1 IS NOT NULL
	    		SET @rs=1
	END	
	IF @Formula ='updated'
	BEGIN    
		SET @rs=0		             
		IF @InputSource LIKE '%-%'
			SET @rs=1
	END	
	IF @Formula ='possible'
	BEGIN    
		SET @rs=0		             
		IF @AlertFieldValue =''
			SET @rs=1
	END
	IF @Formula ='sub_if'
	BEGIN    
		SET @rs=0		             
		SELECT @TimeInt1 = lt.TimeMinute
	    FROM   dbo.ListTime AS lt WITH (NOLOCK)
	    WHERE  lt.TimeSTR = @AlertFieldValue
	    SELECT @TimeInt2=lt.TimeMinute
	               FROM   dbo.fn_split2(@FieldValue, ',') AS fs
	               LEFT JOIN dbo.ListTime AS lt WITH (NOLOCK)
	                           ON  fs.items = lt.TimeSTR
	    WHERE fs.stt=1
	    SELECT @TimeInt3=lt.TimeMinute
	               FROM   dbo.fn_split2(@FieldValue, ',') AS fs
	               LEFT JOIN dbo.ListTime AS lt WITH (NOLOCK)
	                           ON  fs.items = lt.TimeSTR
	    WHERE fs.stt=2
	    IF @TimeInt3 IS NOT NULL AND @TimeInt2 IS NOT NULL AND @TimeInt1 IS NOT NULL 
	    BEGIN
	    	IF @TimeInt1-@TimeInt2>try_cast(@Parameter AS INT) AND @TimeInt1 IS NOT NULL
	    		SET @rs=1
	    END
	END	
	RETURN @rs
END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_CalcDistance]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   FUNCTION [dbo].[fn_CalcDistance](@lat1 FLOAT, @lon1 FLOAT, @lat2 FLOAT, @lon2 FLOAT)
RETURNS FLOAT 
AS
BEGIN
	--geography::Point(@lat1, 106.660388, 4326).STDistance(geography::Point(p.Lat,p.Long, 4326))
    RETURN ACOS(SIN(PI()*@lat1/180.0)*SIN(PI()*@lat2/180.0)+COS(PI()*@lat1/180.0)*COS(PI()*@lat2/180.0)*COS(PI()*@lon2/180.0-PI()*@lon1/180.0))*6371
END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_CalcDistanceKM]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   FUNCTION [dbo].[fn_CalcDistanceKM](@lat1 FLOAT, @lat2 FLOAT, @lon1 FLOAT, @lon2 FLOAT)
RETURNS FLOAT 
AS
BEGIN

    RETURN ACOS(SIN(PI()*@lat1/180.0)*SIN(PI()*@lat2/180.0)+COS(PI()*@lat1/180.0)*COS(PI()*@lat2/180.0)*COS(PI()*@lon2/180.0-PI()*@lon1/180.0))*6371
END
GO
/****** Object:  UserDefinedFunction [dbo].[fn_CalcFunctionRequirement]    Script Date: 5/5/2026 12:20:41 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE    FUNCTION [dbo].[fn_CalcFunctionRequirement] (@Formula NVARCHAR(MAX),
@FieldName NVARCHAR(MAX),
@FieldCalc NVARCHAR(MAX),
@InputSource NVARCHAR(MAX),
@BeforeValue NVARCHAR(MAX),
@Parameter NVARCHAR(MAX))
RETURNS NVARCHAR(MAX)
AS

BEGIN
  DECLARE @rs NVARCHAR(MAX)
  DECLARE @TimeInt INT
         ,@TimeInt2 INT
         ,@TimeInt3 INT
  DECLARE @ParkingBay NVARCHAR(MAX)
         ,@Runway NVARCHAR(MAX)
         ,@DiffDate VARCHAR(1)
         ,@FlightDate DATETIME
  DECLARE @TOBTTimeNEW DATETIME
         ,@TOBTNEW VARCHAR(5)
         ,@TOBTTimeOLD DATETIME
         ,@TOBT_OLD VARCHAR(5)
         ,@TSAT VARCHAR(5)
         ,@TOBTManual VARCHAR(1)
         ,@TSATManual VARCHAR(1)
         ,@TOBTChange VARCHAR(1)
         ,@TSATChange VARCHAR(1)
         ,@TOBT_BEFORE VARCHAR(5)
         ,@APRK VARCHAR(20)
         ,@DPRK VARCHAR(20)
         ,@RAMP VARCHAR(20)
         ,@RouteType VARCHAR(3)
		 ,@Route VARCHAR(7)
  DECLARE @X INT = 25

  IF @Formula = 'SET'
  BEGIN
    SET @rs = @Parameter
  END
  IF @Formula = 'SETST'
  BEGIN
	IF ISNULL(@FieldCalc,'') <> ''
		SET @rs = @Parameter
  END
