IF OBJECT_ID(N'[dbo].[AreaColorOverrides]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AreaColorOverrides](
        [AreaColorID] [int] IDENTITY(1,1) NOT NULL,
        [MappedinID] [nvarchar](100) NOT NULL,
        [ColorHex] [nvarchar](7) NOT NULL,
        [UpdatedAt] [datetime2](7) NOT NULL CONSTRAINT [DF_AreaColorOverrides_UpdatedAt] DEFAULT (SYSUTCDATETIME()),
        [UpdatedBy] [nvarchar](100) NULL,
        CONSTRAINT [PK_AreaColorOverrides] PRIMARY KEY CLUSTERED ([AreaColorID] ASC),
        CONSTRAINT [UQ_AreaColorOverrides_MappedinID] UNIQUE NONCLUSTERED ([MappedinID] ASC),
        CONSTRAINT [CK_AreaColorOverrides_ColorHex] CHECK ([ColorHex] like '#[0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]')
    );

    PRINT N'Created dbo.AreaColorOverrides';
END
ELSE
BEGIN
    PRINT N'dbo.AreaColorOverrides already exists';
END
GO
