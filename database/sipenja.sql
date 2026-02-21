/*==============================================================*/
/* DBMS name:      MySQL 5.0                                    */
/* Created on:     2/1/2026 6:14:13 PM                          */
/*==============================================================*/


drop table if exists DETAILTRANSAKSISERVIS;

drop table if exists KATEGORISPAREPART;

drop table if exists LAYANANSERVIS;

drop table if exists PROGRESSSERVIS;

drop table if exists SERVIS;

drop table if exists SERVISSPAREPART;

drop table if exists SPAREPART;

drop table if exists SUPPLIER;

drop table if exists TRANSAKSI;

drop table if exists TRANSAKSIPEMBELIANSPAREPART;

drop table if exists USER;

/*==============================================================*/
/* Table: DETAILTRANSAKSISERVIS                                 */
/*==============================================================*/
create table DETAILTRANSAKSISERVIS
(
   IDSERVIS             int not null,
   IDLAYANANSERVIS      int not null,
   IDDETAILTRANSAKSISERVIS int not null,
   BIAYA                decimal,
   KETERANGAN           text,
   primary key (IDSERVIS, IDLAYANANSERVIS, IDDETAILTRANSAKSISERVIS)
);

/*==============================================================*/
/* Table: KATEGORISPAREPART                                     */
/*==============================================================*/
create table KATEGORISPAREPART
(
   IDKATEGORI           int not null,
   NAMA                 varchar(255),
   KODE                 varchar(50),
   primary key (IDKATEGORI)
);

/*==============================================================*/
/* Table: LAYANANSERVIS                                         */
/*==============================================================*/
create table LAYANANSERVIS
(
   IDLAYANANSERVIS      int not null,
   KODELAYANAN          varchar(50),
   NAMA                 varchar(255),
   BIAYAPOKOK           decimal,
   DESKRIPSI            text,
   primary key (IDLAYANANSERVIS)
);

/*==============================================================*/
/* Table: PROGRESSSERVIS                                        */
/*==============================================================*/
create table PROGRESSSERVIS
(
   IDPROGRESSERVIS      int not null,
   IDSERVIS             int not null,
   WAKTU                datetime,
   STATUS               varchar(15),
   KETERANGAN           text,
   primary key (IDPROGRESSERVIS)
);

/*==============================================================*/
/* Table: SERVIS                                                */
/*==============================================================*/
create table SERVIS
(
   IDSERVIS             int not null,
   IDUSER               int not null,
   IDTRANSAKSI          int,
   KODEANTRIAN          varchar(50),
   TANGGALMASUK         datetime,
   TANGGALSELESAI       datetime,
   STATUS               varchar(15),
   KELUHAN              text,
   NAMAPELANGGAN        varchar(255),
   primary key (IDSERVIS)
);

/*==============================================================*/
/* Table: SERVISSPAREPART                                       */
/*==============================================================*/
create table SERVISSPAREPART
(
   IDSERVIS             int not null,
   IDSPAREPART          int not null,
   IDSERVISSPAREPART    int not null,
   QTY                  int,
   HARGASATUAN          decimal,
   SUBTOTAL             decimal,
   primary key (IDSERVIS, IDSPAREPART, IDSERVISSPAREPART)
);

/*==============================================================*/
/* Table: SPAREPART                                             */
/*==============================================================*/
create table SPAREPART
(
   IDSPAREPART          int not null,
   IDKATEGORI           int,
   IDSUPPLIER           int not null,
   KODESPAREPART        varchar(50),
   NAMA                 varchar(255),
   HARGAJUAL            decimal,
   STOK                 int,
   STOKMINIMUM          int,
   primary key (IDSPAREPART)
);

/*==============================================================*/
/* Table: SUPPLIER                                              */
/*==============================================================*/
create table SUPPLIER
(
   IDSUPPLIER           int not null,
   NAMA                 varchar(255),
   NOHP                 varchar(50),
   ALAMAT               text,
   primary key (IDSUPPLIER)
);

/*==============================================================*/
/* Table: TRANSAKSI                                             */
/*==============================================================*/
create table TRANSAKSI
(
   IDTRANSAKSI          int not null,
   IDUSER               int not null,
   NOTRANSAKSI          varchar(50),
   TANGGAL              datetime,
   JENISTRANSAKSI       varchar(20),
   TOTAL                decimal,
   CATATAN              text,
   primary key (IDTRANSAKSI)
);

/*==============================================================*/
/* Table: TRANSAKSIPEMBELIANSPAREPART                           */
/*==============================================================*/
create table TRANSAKSIPEMBELIANSPAREPART
(
   IDTRANSAKSI          int not null,
   IDSPAREPART          int not null,
   IDBELISPAREPART      int not null,
   JUMLAH               int,
   HARGA_SATUAN         decimal,
   SUB_TOTAL            decimal,
   primary key (IDTRANSAKSI, IDSPAREPART, IDBELISPAREPART)
);

/*==============================================================*/
/* Table: USER                                                  */
/*==============================================================*/
create table USER
(
   IDUSER               int not null,
   NAMA                 varchar(255),
   USERNAME             varchar(255),
   TANGGALLAHIR         date,
   JENISKELAMIN         varchar(15),
   ROLE                 varchar(10),
   PASSWORD             varchar(255),
   STATUS               varchar(15),
   CREATEDAT            datetime,
   LASTLOGIN            datetime,
   primary key (IDUSER)
);

alter table DETAILTRANSAKSISERVIS add constraint FK_MERUJUK foreign key (IDLAYANANSERVIS)
      references LAYANANSERVIS (IDLAYANANSERVIS) on delete restrict on update restrict;

alter table DETAILTRANSAKSISERVIS add constraint FK_TERDIRI_DARI foreign key (IDSERVIS)
      references SERVIS (IDSERVIS) on delete restrict on update restrict;

alter table PROGRESSSERVIS add constraint FK_MEMPUNYAI foreign key (IDSERVIS)
      references SERVIS (IDSERVIS) on delete restrict on update restrict;

alter table SERVIS add constraint FK_BERISI foreign key (IDTRANSAKSI)
      references TRANSAKSI (IDTRANSAKSI) on delete restrict on update restrict;

alter table SERVIS add constraint FK_MENANGANI foreign key (IDUSER)
      references USER (IDUSER) on delete restrict on update restrict;

alter table SERVISSPAREPART add constraint FK_MENGACU foreign key (IDSPAREPART)
      references SPAREPART (IDSPAREPART) on delete restrict on update restrict;

alter table SERVISSPAREPART add constraint FK_MENGGUNAKAN foreign key (IDSERVIS)
      references SERVIS (IDSERVIS) on delete restrict on update restrict;

alter table SPAREPART add constraint FK_BERDASARKAN foreign key (IDKATEGORI)
      references KATEGORISPAREPART (IDKATEGORI) on delete restrict on update restrict;

alter table SPAREPART add constraint FK_MENYEDIAKAN foreign key (IDSUPPLIER)
      references SUPPLIER (IDSUPPLIER) on delete restrict on update restrict;

alter table TRANSAKSI add constraint FK_MENCATAT foreign key (IDUSER)
      references USER (IDUSER) on delete restrict on update restrict;

alter table TRANSAKSIPEMBELIANSPAREPART add constraint FK_BERSUMBER foreign key (IDSPAREPART)
      references SPAREPART (IDSPAREPART) on delete restrict on update restrict;

alter table TRANSAKSIPEMBELIANSPAREPART add constraint FK_MEMILIKI foreign key (IDTRANSAKSI)
      references TRANSAKSI (IDTRANSAKSI) on delete restrict on update restrict;

