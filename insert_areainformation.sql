INSERT INTO [dbo].[AreaInformation] ([AreaListID], [InformationVN], [InformationEN], [InformationZH], [InformationJA], [InformationKO], [ImageUrl])

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-01 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-01 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e5b1b8b279f8041d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-01 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-01 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d3aa18317cf4c958' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-01 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-01 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_ee2750626f16e5b5' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-01 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-01 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_865422805d0884cb' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-01 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-01 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_bf2d2d1a8396a426' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-01 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-01 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6812883ca3592058' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-01 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-01 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_15aa51700e065178' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-01 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-01 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_fa90b20ff5ba0213' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-01 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-01 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a9e577a4dd1ef84b' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-01 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-01 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-01 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-01 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-01입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_824470af28783353' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-02 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-02 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e9f8539e3d12e3e1' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-02 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-02 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_9c14c21cc50e61e6' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-02 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-02 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a1e352cd20583531' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-02 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-02 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6cdebb1436649a30' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-02 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-02 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_1f65ba36bf7f5a4e' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-02 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-02 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_3c89b46b81590751' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-02 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-02 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_b7e3d37ec9b8d640' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-02 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-02 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e8628f9ea40f2cb1' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-02 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-02 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_dcfc7bec011a7d32' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-02 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-02 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-02 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-02 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-02입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_be6f96b41026373d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-03 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-03 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_728def929283eb5e' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-03 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-03 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f3198b644bcebbeb' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-03 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-03 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_67ab25877c7ab4fc' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-03 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-03 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e48696d3d2cb6fcb' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-03 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-03 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_affa80fdb23e1c36' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-03 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-03 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_7905dbdc6a0958a2' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-03 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-03 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_995d388ce4e98dde' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-03 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-03 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_0442b445d64f113d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-03 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-03 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_b6e04c5321cc35dd' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-03 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-03 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-03 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-03 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-03입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d55d3e047654acbc' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-04 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-04 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_4134fdf4f09ac368' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-04 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-04 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a572d3ef9a321d49' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-04 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-04 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_82ddfbf0f6e7434a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-04 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-04 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_91965b9724249798' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-04 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-04 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_ec885ac1ea041d16' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-04 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-04 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_2809dfcd82de1a04' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-04 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-04 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e5b944212593a5d8' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-04 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-04 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_db79ec4c3b1931b8' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-04 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-04 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6b90931affeca2da' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-04 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-04 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-04 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-04 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-04입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a239a24a92b0a1aa' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-05 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-05 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a2e01f23e31c7c76' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-05 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-05 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_ad8a99104ed023ad' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-05 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-05 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_647db71856a65e30' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-05 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-05 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_fb06eead0391d955' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-05 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-05 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_cc12a68cd9ba17f3' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-05 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-05 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_56ad13fdf8c406e0' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-05 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-05 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_9761a2c9558528ab' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-05 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-05 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_eb3a8346a581982c' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-05 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-05 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d6ddd743b9e6c7ad' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-05 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-05 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-05 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-05 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-05입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_91b31c468694a31a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-06 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-06 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_7efbbee03d5a8cdb' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-06 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-06 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d80e56f9b8147b3c' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-06 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-06 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_650a188cf17b9cc7' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-06 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-06 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d230be184a3e2dee' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-06 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-06 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_0ec7f8c275dc2eba' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-06 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-06 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6ef5ac59493efd11' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-06 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-06 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_8f2c99b4278810aa' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-06 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-06 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_2ac70896503273ef' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-06 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-06 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_3899b1ca41ce528f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-06 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-06 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-06 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-06 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-06입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_57111fa16dd2e5b1' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-07 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-07 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_ba3e41e217f243ec' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-07 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-07 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6780ecef424e8f0e' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-07 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-07 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a065c356b3b90d96' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-07 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-07 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_4ddd11633794ff10' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-07 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-07 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_0e1d1e291b71d45d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-07 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-07 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f672c544643537e5' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-07 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-07 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_3ea0074934c0e924' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-07 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-07 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_b6f2cf009edc381f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-07 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-07 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_05eca1cc64a431d9' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-07 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-07 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-07 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-07 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-07입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_718212508f5003f6' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-08 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-08 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_710e673aa1d8bb5f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-08 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-08 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_3e62edcec789608c' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-08 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-08 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d5e00cef2d8fe7ea' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-08 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-08 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_66a6fa172bd3afdf' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-08 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-08 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_bf43062b5cc71f47' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-08 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-08 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_ceed870147e88830' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-08 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-08 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_0ee252520df4528a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-08 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-08 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e67f6ebefa70888f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-08 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-08 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_2a826fe811b12f54' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-08 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-08 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-08 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-08 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-08입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_30a2195fb935b9f4' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-09 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-09 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_77636c0a7d07e81b' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-09 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-09 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_15964a1aec81a94b' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-09 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-09 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_c73863d0e80bc220' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-09 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-09 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6e4f1fe116a70d03' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-09 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-09 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_02d1cac9aa62082c' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-09 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-09 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_94eabf42df38ba29' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-09 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-09 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_9bba4d64f902b7e6' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-09 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-09 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_1db4db4133387f77' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-09 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-09 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d7e1ae4ad5abd9b7' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-09 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-09 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-09 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-09 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-09입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_92b6ce6d312cdeb7' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-10 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-10 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_84ff4de9088c56be' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-10 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-10 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_19dbcfbac30050ed' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-10 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-10 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_c6ee5aae89a502cf' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-10 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-10 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_eadb71132892126e' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-10 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-10 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_95c2ace4f2619c4e' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-10 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-10 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_303a5c76a788b067' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-10 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-10 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_c926bc08137f1568' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-10 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-10 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_79b9f3e06198b81f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-10 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-10 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_1e1fede422cad3f6' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-10 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-10 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-10 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-10 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-10입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d2d55bce7413893a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-11 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-11 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_17dea1900cafb2ec' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-11 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-11 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_132532cbebc7f9af' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-11 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-11 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f44fa3b87ee1428b' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-11 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-11 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_c2c8d904c4241205' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-11 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-11 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a555bddb7d3caeb7' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-11 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-11 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_76702457eaab1611' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-11 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-11 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_4968cee030cddf7c' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-11 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-11 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_8785b0bf3915af48' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-11 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-11 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_21d1a2286f9165ac' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-11 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-11 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-11 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-11 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-11입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_1b3de0548fbc2b75' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-12 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-12 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_eac12576fd2b244d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-12 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-12 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_da12229005828b1f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-12 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-12 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_280f976e99e417fa' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-12 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-12 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d61fb39f1837a76a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-12 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-12 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_db9bfc5144536fe1' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-12 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-12 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e80d36a81834df85' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-12 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-12 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_035baa287910521d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-12 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-12 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_70115ea6e64407e0' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-12 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-12 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_853ed5b46919100b' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-12 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-12 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-12 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-12 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-12입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_450372eeaa3d7f03' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-13 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-13 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_23a33c09315fa0dc' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-13 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-13 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_efda032b091c7f64' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-13 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-13 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_dc5ebfcd705d1efe' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-13 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-13 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_49b54f2d01de60c5' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-13 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-13 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_4be8927e193c3f8a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-13 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-13 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f72844616952bb2a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-13 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-13 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_55bce17c70268553' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-13 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-13 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_284f7f23261ab4bc' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-13 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-13 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_c122c3c4d0e8b2d8' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-13 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-13 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-13 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-13 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-13입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_4bd340195b48dca3' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục A-14 thuộc đảo làm thủ tục A, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter A-14 at Check-in Island A, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 A 的 A-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド A のチェックインカウンター A-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 A의 체크인 카운터 A-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_77c0e3e6d795ccfb' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-14 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-14 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_31362804d5b73716' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-14 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-14 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_b0d14596522db6c8' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-14 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-14 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_773b38be31c9e9fa' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục E-14 thuộc đảo làm thủ tục E, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter E-14 at Check-in Island E, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 E 的 E-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド E のチェックインカウンター E-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 E의 체크인 카운터 E-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_8abecf8ead7c06ff' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục F-14 thuộc đảo làm thủ tục F, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter F-14 at Check-in Island F, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 F 的 F-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド F のチェックインカウンター F-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 F의 체크인 카운터 F-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d84cdafd4cbc4a51' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-14 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-14 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f22df5433d668ed4' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-14 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-14 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_22947e133fbba4c7' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-14 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-14 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_04870d6007e85a4a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục J-14 thuộc đảo làm thủ tục J, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter J-14 at Check-in Island J, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 J 的 J-14 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド J のチェックインカウンター J-14 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 J의 체크인 카운터 J-14입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f1e5caa51d6b468f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-15 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-15 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-15 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-15 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-15입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_92d43ddf1e3a093e' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-15 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-15 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-15 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-15 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-15입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a8809379f02087a0' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-15 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-15 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-15 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-15 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-15입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_343cbc4d3840e0b4' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-15 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-15 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-15 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-15 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-15입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_c7a43d46671a54de' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-15 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-15 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-15 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-15 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-15입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_7c748b49b26e1b8d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-15 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-15 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-15 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-15 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-15입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_2159222c1eb93739' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-16 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-16 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-16 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-16 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-16입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_bdcf111075a16382' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-16 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-16 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-16 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-16 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-16입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_97d23f40cfb07c07' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-16 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-16 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-16 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-16 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-16입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_3e3ee3d7863b41ce' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-16 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-16 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-16 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-16 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-16입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_1b6a0df7518c4f4f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-16 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-16 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-16 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-16 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-16입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f925ea3c9c1442b9' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-16 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-16 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-16 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-16 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-16입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_dfb99c5a99e1a934' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-17 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-17 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-17 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-17 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-17입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_776b939648ee3663' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-17 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-17 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-17 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-17 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-17입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d4366881d167e15c' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-17 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-17 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-17 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-17 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-17입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_54f6cba7f514cdbf' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-17 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-17 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-17 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-17 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-17입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_30aec86290893009' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-17 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-17 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-17 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-17 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-17입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_b9609d4d4a0b01a3' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-17 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-17 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-17 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-17 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-17입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_53f9681e04c85416' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-18 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-18 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-18 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-18 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-18입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_105cfd24da726107' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-18 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-18 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-18 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-18 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-18입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f4d708196c8b5f01' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-18 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-18 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-18 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-18 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-18입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_110a1591e20bc40e' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-18 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-18 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-18 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-18 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-18입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_21d190ab942e0bfa' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-18 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-18 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-18 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-18 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-18입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_34dcf5d69e434455' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-18 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-18 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-18 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-18 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-18입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_ef03e20b800b9553' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-19 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-19 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-19 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-19 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-19입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_418d133a8244eceb' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-19 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-19 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-19 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-19 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-19입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_2cbbfbb40d8cd165' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-19 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-19 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-19 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-19 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-19입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_ba805123fbbe7e69' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-19 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-19 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-19 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-19 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-19입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_20adb4c92e3e44a1' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-19 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-19 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-19 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-19 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-19입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_758fe77e71150e72' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-19 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-19 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-19 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-19 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-19입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_99db14c7384f3641' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-20 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-20 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-20 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-20 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-20입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_62bced3726be123a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-20 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-20 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-20 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-20 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-20입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_12038bdafc510f99' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-20 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-20 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-20 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-20 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-20입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_74ffddf8bd05ea9a' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-20 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-20 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-20 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-20 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-20입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_249ccde3cbd273d0' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-20 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-20 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-20 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-20 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-20입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_0e01ee69a849da87' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-20 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-20 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-20 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-20 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-20입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_534fbf1d34aec693' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-21 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-21 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-21 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-21 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-21입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_def6b671fe0a4afc' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-21 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-21 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-21 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-21 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-21입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_c4f4b877b69fdbd4' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-21 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-21 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-21 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-21 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-21입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_0c9246676acc0a18' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-21 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-21 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-21 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-21 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-21입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_89d7271cd7e9be3f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-21 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-21 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-21 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-21 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-21입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_06c6cb4b31e19a09' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-21 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-21 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-21 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-21 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-21입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6ea6ce55c3661a40' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-22 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-22 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-22 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-22 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-22입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_5258a0b3471e7bcb' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-22 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-22 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-22 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-22 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-22입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f89349aa4fe08e6f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-22 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-22 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-22 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-22 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-22입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a0b94cfe0d4754e4' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-22 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-22 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-22 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-22 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-22입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_cfc7e372b50bac48' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-22 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-22 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-22 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-22 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-22입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_1383a8b1452bbf01' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-22 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-22 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-22 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-22 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-22입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_930f0eb450430a72' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-23 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-23 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-23 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-23 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-23입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6f2bdb18bf5c1bf9' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-23 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-23 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-23 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-23 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-23입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_3e07116dfaf681b5' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-23 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-23 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-23 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-23 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-23입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e7f8cc22158385f9' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-23 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-23 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-23 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-23 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-23입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_224e114c05207281' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-23 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-23 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-23 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-23 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-23입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_b7a2a61e2180259b' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-23 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-23 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-23 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-23 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-23입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_dce1ff1f46bbbadb' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-24 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-24 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-24 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-24 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-24입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_51b062ce4770837f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-24 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-24 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-24 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-24 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-24입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_531ad1477a38ee99' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-24 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-24 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-24 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-24 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-24입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e1e3a43adc44160d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-24 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-24 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-24 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-24 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-24입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_fd6ac0757b4a68b7' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-24 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-24 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-24 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-24 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-24입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_4b9eba2baf532bea' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-24 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-24 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-24 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-24 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-24입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_b2bb0b8007afb528' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-25 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-25 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-25 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-25 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-25입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_657d1add573c2c1f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-25 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-25 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-25 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-25 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-25입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6538faab64f1a560' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-25 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-25 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-25 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-25 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-25입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_c6ebf48c550781e1' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-25 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-25 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-25 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-25 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-25입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_ed586a9d5433c0bd' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-25 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-25 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-25 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-25 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-25입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_e692cb08a70af0a1' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-25 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-25 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-25 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-25 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-25입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_33aa88ef8576be58' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-26 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-26 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-26 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-26 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-26입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_f981168bb649b12f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-26 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-26 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-26 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-26 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-26입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_46660e59a324e188' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-26 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-26 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-26 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-26 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-26입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_ea1bdd51e109932c' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-26 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-26 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-26 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-26 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-26입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_6be0f049abac9ee2' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-26 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-26 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-26 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-26 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-26입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_3c888539aa96e6d2' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-26 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-26 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-26 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-26 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-26입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_d96b062018d7a339' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-27 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-27 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-27 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-27 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-27입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_c35f079821648155' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-27 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-27 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-27 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-27 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-27입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_65d32d4784f47cb0' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-27 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-27 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-27 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-27 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-27입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_554e04ea53a31939' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-27 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-27 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-27 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-27 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-27입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_42b9f3379087d66c' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-27 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-27 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-27 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-27 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-27입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_3cae195c378bc69c' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-27 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-27 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-27 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-27 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-27입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_5898a04b2ef128fe' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục B-28 thuộc đảo làm thủ tục B, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter B-28 at Check-in Island B, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 B 的 B-28 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド B のチェックインカウンター B-28 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 B의 체크인 카운터 B-28입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_557c5493a3b763c5' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục C-28 thuộc đảo làm thủ tục C, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter C-28 at Check-in Island C, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 C 的 C-28 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド C のチェックインカウンター C-28 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 C의 체크인 카운터 C-28입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_afd7058dca5e800d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục D-28 thuộc đảo làm thủ tục D, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter D-28 at Check-in Island D, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 D 的 D-28 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド D のチェックインカウンター D-28 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 D의 체크인 카운터 D-28입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_a7875c2648270b9d' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục G-28 thuộc đảo làm thủ tục G, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter G-28 at Check-in Island G, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 G 的 G-28 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド G のチェックインカウンター G-28 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 G의 체크인 카운터 G-28입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_bcbe2e92ec48e9de' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục H-28 thuộc đảo làm thủ tục H, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter H-28 at Check-in Island H, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 H 的 H-28 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド H のチェックインカウンター H-28 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 H의 체크인 카운터 H-28입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_3ba4628eb7af834f' 
    UNION ALL

    SELECT 
        AreaListID,
        N'Quầy thủ tục I-28 thuộc đảo làm thủ tục I, phục vụ hành khách làm thủ tục check-in, gửi hành lý và nhận thẻ lên tàu bay theo phân công của hãng hàng không.',
        N'Check-in Counter I-28 at Check-in Island I, serving passengers for check-in, baggage drop, and boarding pass issuance as assigned by the airline.',
        N'位于值机岛 I 的 I-28 值机柜台，根据航空公司安排，为旅客提供值机、行李托运和登机牌办理服务。',
        N'チェックインアイランド I のチェックインカウンター I-28 です。航空会社の割り当てに従い、チェックイン、手荷物の預け入れ、搭乗券の発行を行っています。',
        N'체크인 아일랜드 I의 체크인 카운터 I-28입니다. 항공사의 배정에 따라 승객의 체크인, 수하물 위탁 및 탑승권 발급 서비스를 제공합니다.',
        'https://cdn.mappedin.com/6821fa68ae9d49000b93de05/6aa610dc961a5f25694abdbcbb4ad809de94d60b.jpg?sv=2023-08-03&st=2026-01-20T00%3A45%3A00Z&se=2026-01-20T03%3A00%3A00Z&sr=c&sp=r&sig=jsuYV3q%2F2Z72Rl8XYLIIutsH75SUbTS8SnP9%2F8oPJ8A%3D'
    FROM [dbo].[AreaList] WHERE [MappedinID] = 's_71fe6db44f1eae9b' 
    ;