-- AlterTable: Reservation に打席料請求済みフラグを追加
ALTER TABLE "Reservation" ADD COLUMN "bayFeeCharged" BOOLEAN NOT NULL DEFAULT false;
